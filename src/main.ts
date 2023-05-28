import kaboom, * as K from "kaboom";
import "kaboom/global";
import kanimPlay, { KanimPlayCtx } from "./plugins/play";
import returnLayer, { ReturnLayerCtx } from "./plugins/layer";
import returnMake, { ReturnMakeCtx } from "./plugins/make";
import kanimUI, { KanimUIContext } from "./uistuff";

const k = kaboom({
    logMax: 10,
    background: [230, 211, 211],
    plugins: [
        returnLayer,
        returnMake,
        kanimPlay,
        kanimUI,
    ] as unknown as K.KaboomPlugin<any>[],
}) as unknown as K.KaboomCtx & ReturnMakeCtx & KanimUIContext & ReturnLayerCtx & KanimPlayCtx;

const THEME_COLOR = k.rgb(120, 127, 255);

k.loadSprite("bean", "sprites/bean.png");
k.loadSprite("playbutton", "sprites/playbutton.png");

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
    easing: easings.linear,
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
    let runningTw = [];
    // #endregion

    k.layers([
        "background",
        "buddy",
        "ui",
    ], "ui");

    // #region UI
    const uiStartState = k.uiAddBox(230, height() / 2, "topleft");
    const uiFinishState = k.uiAddBox(230, height() / 2, "botleft");
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

    // const uiAnimationSettings = addUIBox(400, 200, vec2(260, 0), "up", "Settings");
    // uiAnimationSettings.addEditableText("name", animations[curAnimIndex].name, (v) => { animations[curAnimIndex].name = v; });
    // uiAnimationSettings.addOption("easings", [...Object.keys(easings)], "linear", (v) => { animations[curAnimIndex].frames[curFrameIndex].settings.easing = easings[v]; });
    // uiAnimationSettings.addEditableText("time", animations[curAnimIndex].frames[curFrameIndex].settings.time, (v) => { animations[curAnimIndex].frames[curFrameIndex].settings.time = v; });
    // // uiAnimationSettings.addCheckbox("auto repeat", false, (v) => { defaultSettings.autoRepeat = v; });

    // const uiAnimations = addUIBox(280, 400, vec2(width() - 280, 0), "up", "Animations");

    // for (let i = 0; i < animations.length; i++) {
    //     uiAnimations.addQuote(animations[i].name);
    // }

    // #region Timeline
    const timeline = k.uiAddBox(width() - 550, 240, "bot");

    function addTimelineFrame(isSelected: boolean, isNew: boolean) {
        const frameBtn = timeline.add([
            pos(10 + (60 * timeline.get("timeline_frame").length), 40),
            anchor("left"),
            fixed(),
            rect(50, 20),
            color(THEME_COLOR),
            outline(0),
            area(),
            "box_element",
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
            if (frameBtn.selected) frameBtn.use(outline(2));
            else frameBtn.unuse("outline");
        });
    };

    for (let i = 0; i < animations[curAnimIndex].frames.length; i++) {
        addTimelineFrame(i == 0, false);
    }

    const addBtn = timeline.add([
        pos(0),
        anchor("center"),
        fixed(),
        text("+", { size: 34 }),
        color(THEME_COLOR),
        area(),
    ]);

    addBtn.onClick(() => {
        addTimelineFrame(false, true);
    });

    addBtn.onUpdate(() => {
        // put in in the front of the latest timeline frame
        addBtn.pos = timeline.get("timeline_frame")[timeline.get("timeline_frame").length - 1]?.pos.add(80, 0);
    });

    const timelineAnimationProgress = timeline.add([
        pos(0, 0),
        fixed(),
        rect(1, 360),
        outline(1),
        color(THEME_COLOR),
        "timeline_animation_progress",
    ]);
    // #endregion

    // #region Play Button
    const playButton = add([
        pos(center().x, 40),
        fixed(),
        sprite("playbutton"),
        anchor("center"),
        area(),
    ]);

    playButton.onClick(() => {
        if (animIsPlaying) resetAnimation();
        else playAnimation();
    });

    playButton.onUpdate(() => {
        if (animIsPlaying) {
            playButton.unuse("sprite");
            playButton.use(rect(50, 50));
            playButton.use(outline(4));
            playButton.use(color(THEME_COLOR));
        }
        else {
            playButton.unuse("rect");
            playButton.unuse("outline");
            playButton.unuse("color");
            playButton.use(sprite("playbutton"));
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
        tween(
            0,
            timeline.get("timeline_frame")[timeline.get("timeline_frame").length - 1].pos.x + 50,
            animations[curAnimIndex].frames[curFrameIndex].settings.time,
            (v) => {
                timelineAnimationProgress.pos.x = v;
            },
            easings.linear,
        );
    }

    function resetAnimation() {
        // TODO: reset animation
    }

    function saveAnimation() {
        let animData = {
            animatons: animations,
        };

        downloadText(`${defaultSettings.name}.kanim`, JSON.stringify(animData));
    }
    // #endregion

    // #region Input
    onKeyPress("s", () => {
        if (isKeyDown("shift" as K.Key)) saveAnimation();
    });

    onKeyPress("space", () => {
        if (animIsPlaying) resetAnimation();
        else playAnimation();
    });

    onScroll((scrollDt) => {
        let multiplier = 2;
        if (isKeyDown("shift" as K.Key)) multiplier = 4;

        if (scrollDt.y < 0) {
            camScale(camScale().add(vec2(dt() * multiplier)));
        }
        else {
            camScale(camScale().sub(vec2(dt() * multiplier)));
        }
    });
    // #endregion

    // #region onUpdate()
    onUpdate(() => {
        // debug.log(curFrameIndex);
    });
    // // #endregion
});
// #endregion


go("newEditor", defaultProject);
