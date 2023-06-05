import kaboom, * as K from "kaboom";
import kanimPlay from "./plugins/play";
import returnLayer from "./plugins/layer";
import kanimUI from "./ui";
import { GameCtx } from "./types";

export const k = kaboom({
    logMax: 10,
    background: [230, 211, 211],
    plugins: [
        returnLayer,
        kanimPlay,
        kanimUI,
    ] as K.KaboomOpt["plugins"],
}) as GameCtx;

const THEME_COLOR = k.rgb(120, 127, 255);
const KEYS = {
    save: "s" as K.Key, // ctrl + s
    play: "space" as K.Key,
}

k.loadSprite("bean", "sprites/bean.png");
k.loadSprite("playbutton", "sprites/playbutton.png");
k.loadBitmapFont("unscii", "fonts/unscii_8x8.png", 8, 8);

// #region Default Options
// The animation's default options
let props = [
    {
        name: "scaleX",
        type: "editableNumber",
    },
    {
        name: "scaleY",
        type: "editableNumber",
    },
    {
        name: "rotation",
        type: "editableNumber",
    },
    {
        name: "opacity",
        type: "editableNumber",
    },
];

let defaultInitialProps = {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
};

let defaultFinishProps = {
    scaleX: 2,
    scaleY: 2,
    rotation: 0,
    opacity: 1,
};

let defaultSettings = {
    name: "example",
    autoRepeat: false,
    easing: k.easings.linear,
    time: 1,
};

let defaultProject = {
    animations: [
        {
            name: "jump",
            frames: [
                {
                    startProps: Object.assign({}, defaultInitialProps),
                    finishProps: Object.assign({}, defaultFinishProps),
                    settings: Object.assign({}, defaultSettings)
                }
            ],
        }
    ],
};
// #endregion

// #region Editor
k.scene("newEditor", (loadedProject) => {
    const animations = [...loadedProject.animations];

    // #region States
    let curAnimIndex = 0;
    let curFrameIndex = 0;
    let animIsPlaying = false;
    let runningTw: K.TweenController[] = [];
    // #endregion

    k.layers([
        "background",
        "buddy",
        "ui",
    ], "ui");

    // #region UI
    const uiStartState = k.uiAddBox(230, k.height() / 2, "topleft");
    const uiFinishState = k.uiAddBox(230, k.height() / 2, "botleft");
    uiStartState.addTitle("Start State");
    uiFinishState.addTitle("Finish State");

    const uiStartInputFields: any[] = [];
    const uiFinishInputFields: any[] = [];

    for (const prop of props) {
        if (prop.type == "editableNumber") {
            const startInputField = uiStartState.addElement(
                prop.name,
                k.uiMakeInputField(animations[curAnimIndex].frames[curFrameIndex].startProps[prop.name].toString()),
            );

            startInputField.onInputSet((v) => {
                animations[curAnimIndex].frames[curFrameIndex].startProps[prop.name] = Number(v);
            });

            const finishInputField = uiFinishState.addElement(
                prop.name,
                k.uiMakeInputField(animations[curAnimIndex].frames[curFrameIndex].finishProps[prop.name].toString()),
            );

            finishInputField.onInputSet((v) => {
                animations[curAnimIndex].frames[curFrameIndex].finishProps[prop.name] = Number(v);
            });

            uiStartInputFields.push(startInputField);
            uiFinishInputFields.push(finishInputField);
        }
    }

    const uiAnimationSettings = k.uiAddBox(400, 200, "topright");
    uiAnimationSettings.addTitle("Animation Settings");
   // uiAnimationSettings.addOption("easings", [...Object.keys(easings)], "linear", (v) => { animations[curAnimIndex].frames[curFrameIndex].settings.easing = easings[v]; });
    // uiAnimationSettings.addEditableText("time", animations[curAnimIndex].frames[curFrameIndex].settings.time, (v) => { animations[curAnimIndex].frames[curFrameIndex].settings.time = v; });
    // uiAnimationSettings.addCheckbox("auto repeat", false, (v) => { defaultSettings.autoRepeat = v; });
    const animName = uiAnimationSettings.addElement("name", k.uiMakeInputField(animations[curAnimIndex].name));
    animName.onInputSet((v) => { animations[curAnimIndex].name = v; });

    // const uiAnimations = addUIBox(280, 400, vec2(width() - 280, 0), "up", "Animations");

    // for (let i = 0; i < animations.length; i++) {
    //     uiAnimations.addQuote(animations[i].name);
    // }

    // #region Timeline
    const timeline = k.uiAddBox(k.width() - 550, 240, "bot");

    function addTimelineFrame(isSelected: boolean, isNew: boolean) {
        const frameBtn = timeline.add([
            k.pos(10 + (60 * timeline.get("timeline_frame").length), 40),
            k.anchor("left"),
            k.fixed(),
            k.rect(50, 20),
            k.color(THEME_COLOR),
            k.outline(0),
            k.area(),
            "boxElement",
            "timeline_frame",
            {
                selected: isSelected,
                index: timeline.get("timeline_frame").length,
            }
        ]);

        if (isNew) {
            const newFrame = {
                startProps: Object.assign({}, defaultInitialProps),
                finishProps: Object.assign({}, defaultFinishProps),
                settings: Object.assign({}, defaultSettings)
            };

            animations[curAnimIndex].frames.push(newFrame);
            console.log(animations[curAnimIndex].frames);

            // curFrameIndex = animations[curAnimIndex].frames.length - 1;
        }

        frameBtn.onClick(() => {
            frameBtn.selected = true;

            for (const frame of timeline.get("timeline_frame")) {
                if (frame != frameBtn) frame.selected = false;
            }

            curFrameIndex = frameBtn.index;

            for (let i = 0; i < uiStartInputFields.length; i++) {
                uiStartInputFields[i].setValue(animations[curAnimIndex].frames[curFrameIndex].startProps[props[i].name].toString());
                uiFinishInputFields[i].setValue(animations[curAnimIndex].frames[curFrameIndex].finishProps[props[i].name].toString());
            }
        });

        frameBtn.onUpdate(() => {
            if (frameBtn.selected) frameBtn.use(k.outline(2));
            else frameBtn.unuse("outline");
        });
    };

    for (let i = 0; i < animations[curAnimIndex].frames.length; i++) {
        addTimelineFrame(i == 0, false);
    }

    const addBtn = timeline.add([
        k.pos(0),
        k.anchor("center"),
        k.fixed(),
        k.text("+", { size: 34, font: "unscii" }),
        k.color(THEME_COLOR),
        k.area(),
    ]);

    addBtn.onClick(() => {
        addTimelineFrame(false, true);
    });

    addBtn.onUpdate(() => {
        // put in in the front of the latest timeline frame
        addBtn.pos = timeline.get("timeline_frame")[timeline.get("timeline_frame").length - 1]?.pos.add(80, 0);
    });

    const timelineAnimationProgress = timeline.add([
        k.pos(0, 0),
        k.fixed(),
        k.rect(1, 360),
        k.outline(1),
        k.color(THEME_COLOR),
        "timeline_animation_progress",
    ]);
    // #endregion

    // #region Play Button
    const playButton = k.add([
        k.pos(k.center().x, 40),
        k.fixed(),
        k.sprite("playbutton"),
        k.anchor("center"),
        k.area(),
    ]);

    playButton.onClick(() => {
        if (animIsPlaying) resetAnimation();
        else playAnimation();
    });

    playButton.onUpdate(() => {
        if (animIsPlaying) {
            playButton.unuse("sprite");
            playButton.use(k.rect(50, 50));
            playButton.use(k.outline(4));
            playButton.use(k.color(THEME_COLOR));
        }
        else {
            playButton.unuse("rect");
            playButton.unuse("outline");
            playButton.unuse("color");
            playButton.use(k.sprite("playbutton"));
        }
    });
    // #endregion
    // #endregion

    // #region Buddy
    const buddy = k.add([
        k.pos(k.center()),
        k.z(10),
        k.anchor("center"),
    ]);

    const buddySprite = buddy.add([
        k.anchor("center"),
        k.sprite("bean"),
        k.kanimAnimation(animations),
    ]);
    // #endregion

    // #region Animation Controller
    function playAnimation() {
        if (animIsPlaying) return;

        buddySprite.use(k.kanimAnimation(animations));
        buddySprite.kmPlay(curAnimIndex);

        // TODO: move to another place
        let allFramesTime = 0;
        for (const frame of animations[curAnimIndex].frames) {
            allFramesTime += frame.settings.time;
        }

        const tw = k.tween(
            0,
            timeline.get("timeline_frame")[timeline.get("timeline_frame").length - 1].pos.x + 50,
            allFramesTime,
            (v) => {
                timelineAnimationProgress.pos.x = v;
            },
            k.easings.linear,
        );

        tw.onEnd(() => {
            animIsPlaying = false;
            runningTw = [];
        });

        runningTw.push(tw);
    }

    function resetAnimation() {
        runningTw.forEach((tw) => {
            tw.cancel();
        });

        runningTw = [];
    }

    function saveAnimation() {
        let animData = {
            animatons: animations,
        };

        k.downloadText(`${defaultSettings.name}.kanim`, JSON.stringify(animData));
    }
    // #endregion

    // #region Input
    k.onKeyPress(KEYS.save, () => {
        if (k.isKeyDown("control")) saveAnimation();
    });

    k.onKeyPress(KEYS.play, () => {
        if (animIsPlaying) resetAnimation();
        else playAnimation();
    });

    k.onScroll((scrollDt) => {
        let multiplier = 2;
        if (k.isKeyDown("shift" as K.Key)) multiplier = 4;

        if (scrollDt.y < 0) {
            k.camScale(k.camScale().add(k.vec2(k.dt() * multiplier)));
        }
        else {
            k.camScale(k.camScale().sub(k.vec2(k.dt() * multiplier)));
        }
    });
    // #endregion

    // #region onUpdate()
    k.onUpdate(() => {
        // k.debug.log(curFrameIndex);
    });
    // // #endregion
});
// #endregion


k.go("newEditor", defaultProject);
