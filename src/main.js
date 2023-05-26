import kaboom from "kaboom";
import "kaboom/global";
import kanimPlugin from "./plugin";
import layerPlugin from "./plugins/layer";
import { addUIBox } from "./uistuff";

kaboom({
    logMax: 10,
    background: [230, 211, 211],
    plugins: [layerPlugin, kanimPlugin],
});

loadSprite("bean", "sprites/bean.png");
loadSprite("playbutton", "sprites/playbutton.png");

const THEME_COLOR = rgb(120, 127, 255);

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
scene("newEditor", (loadedProject) => {
    const animations = [...loadedProject.animations];

    // #region States
    let curAnimIndex = 0;
    let curFrameIndex = 0;
    let animIsPlaying = false;
    let runningTw = [];
    // #endregion

    layers([
        "background",
        "buddy",
        "ui",
    ], "ui");

    // #region UI
    const uiStartState = addUIBox(230, height() / 2, vec2(0), "left", "Start");
    const uiFinishState = addUIBox(230, height() / 2, vec2(0, height() / 2), "left", "Finish");

    for (const prop of props) {
        if (prop.type == "editableNumber") {
            uiStartState.addEditableText(
                prop.name,
                animations[curAnimIndex].frames[curFrameIndex].startProps[prop.name],
                (v) => {
                    animations[curAnimIndex].frames[curFrameIndex].startProps[prop.name] = Number(v);
                }
            );
            uiFinishState.addEditableText(
                prop.name,
                animations[curAnimIndex].frames[curFrameIndex].finishProps[prop.name],
                (v) => {
                    animations[curAnimIndex].frames[curFrameIndex].finishProps[prop.name] = Number(v);
                }
            );
        }
    }

    const uiAnimationSettings = addUIBox(400, 200, vec2(260, 0), "up", "Settings");
    uiAnimationSettings.addEditableText("name", animations[curAnimIndex].name, (v) => { animations[curAnimIndex].name = v; });
    uiAnimationSettings.addOption("easings", [...Object.keys(easings)], "linear", (v) => { animations[curAnimIndex].frames[curFrameIndex].easing = easings[v]; });
    uiAnimationSettings.addEditableText("time", animations[curAnimIndex].frames[curFrameIndex].time, (v) => { animations[curAnimIndex].frames[curFrameIndex].time = v; });
    // uiAnimationSettings.addCheckbox("auto repeat", false, (v) => { defaultSettings.autoRepeat = v; });

    const uiAnimations = addUIBox(280, 400, vec2(width() - 280, 0), "up", "Animations");

    for (let i = 0; i < animations.length; i++) {
        uiAnimations.addQuote(animations[i].name);
    }

    const timeline = addUIBox(width() - 550, 240, vec2(570 / 2, height() - 240), "down");

    timeline.addTimelineFrame = (isSelected) => {
        const frameBtn = timeline.add([
            pos(10 + (60 * timeline.get("timelineFrame").length), 40),
            anchor("left"),
            fixed(),
            rect(50, 20),
            color(THEME_COLOR),
            outline(0),
            area(),
            "boxElement",
            "timelineFrame",
            {
                selected: isSelected,
                index: timeline.get("timelineFrame").length,
            }
        ]);

        frameBtn.onClick(() => {
            frameBtn.selected = true;

            // for (const frame of timeline.get("timelineFrame")) {
            //     if (frame != frameBtn) frame.selected = false;
            // }


            // for (const prop of props) {
            //     initialState.get(prop.name).value = currentEditingFrame.initialProps[prop.name];
            //     finishState.get(prop.name).value = currentEditingFrame.finishProps[prop.name];
            // }

            curFrameIndex = frameBtn.index;
        });

        frameBtn.onUpdate(() => {
            if (frameBtn.selected) frameBtn.use(outline(2));
            else frameBtn.unuse("outline");
        });
    };

    for (let i = 0; i < animations[curAnimIndex].frames.length; i++) {
        timeline.addTimelineFrame(i == 0);
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
        timeline.addTimelineFrame(false);
    });

    addBtn.onUpdate(() => {
        // put in in the front of the latest timeline frame
        addBtn.pos = timeline.get("timelineFrame")[timeline.get("timelineFrame").length - 1]?.pos.add(80, 0);
    });

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
    const buddy = add([
        pos(center()),
        z(10),
        anchor("center"),
    ]);

    const buddySprite = buddy.add([
        anchor("center"),
        sprite("bean"),
        kanimAnimation(animations),
    ]);
    // #endregion

    // #region Animation Controller
    function playAnimation() {
        if (animIsPlaying) return;

        buddySprite.use(kanimAnimation(animations));
        buddySprite.kmPlay(curAnimIndex);
    }

    function saveAnimation() {
        let animData = {
            initialProps,
            finishProps,
        };

        downloadText(`${defaultSettings.name}.kanim`, JSON.stringify(animData));
    }
    // #endregion

    // #region Input
    onKeyPress("s", () => {
        if (isKeyDown("shift")) saveAnimation();
    });

    // onKeyPress("space", () => {
    //     if (isInPlay) resetAnimation();
    //     else playAnimation();
    // });

    onScroll((scrollDt) => {
        let multiplier = 2;
        if (isKeyDown("shift")) multiplier = 4;

        if (scrollDt.y < 0) {
            camScale(camScale().add(vec2(dt() * multiplier)));
        }
        else {
            camScale(camScale().sub(vec2(dt() * multiplier)));
        }
    });
    // #endregion

    // #region onUpdate()
    // #endregion
});
// #endregion


go("newEditor", defaultProject);
