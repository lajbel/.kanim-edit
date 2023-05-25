import kaboom from "kaboom";
import "kaboom/global";
import { addUIBox } from "./uistuff";

kaboom({
    background: [230, 211, 211],
    logMax: 10,
});

loadSprite("bean", "sprites/bean.png");
loadSprite("playbutton", "sprites/playbutton.png");

let curDraggin = null;

function drag() {
    let offset = vec2(0);

    return {
        id: "drag",
        require: ["pos", "area"],
        pick() {
            curDraggin = this;
            offset = toScreen(mousePos().sub(this.pos));
            this.trigger("drag");
        },

        update() {
            if (curDraggin === this) {
                this.pos = toScreen(mousePos().sub(offset));
                this.trigger("dragUpdate");
            }
        },
        onDrag(action) {
            return this.on("drag", action);
        },
        onDragUpdate(action) {
            return this.on("dragUpdate", action);
        },
        onDragEnd(action) {
            return this.on("dragEnd", action);
        },
    };
}

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

let initialProps = {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
};

let finishProps = {
    scaleX: 2,
    scaleY: 2,
    rotation: 0,
    opacity: 1,
};

let settings = {
    name: "example",
    autoRepeat: false,
    easing: easings.linear,
    animationTime: 1,
};

let project = {
    "example": {
        animations: {
            "default": {
                frames: [
                    {
                        initialProps: initialProps,
                        finishProps: finishProps,
                        settings: settings,
                    }
                ],
            }
        },
    }
};
// #endregion

let state = {
    currentEditingAnim: "default",
};

scene("editor", (project) => {
    let { initialProps, finishProps } = project["example"].animations["default"].frames[0];
    let currentAnimation = project["example"].animations["default"];
    let currentFrame = currentAnimation.frames[0];

    let animationTranscurredTime = 0;
    let tweenings = [];

    let isInPlay = false;
    let playingProps = { ...initialProps };

    // #region UI
    const initialState = addUIBox(230, height() - 20, vec2(10, 10), "left");
    initialState.setTitle("Initial");

    const finishState = addUIBox(230, height() - 20, vec2(width() - 240, 10), "right");
    finishState.setTitle("Modify");

    for (const prop of props) {
        if (prop.type == "editableNumber") {
            initialState.addEditableText(prop.name, initialProps[prop.name], (v) => { initialProps[prop.name] = Number(v); });
            finishState.addEditableText(prop.name, finishProps[prop.name], (v) => { finishProps[prop.name] = Number(v); });
        }
    }

    const animationOptions = addUIBox(400, 230, vec2(initialState.pos.add(260, 0)), "up");
    animationOptions.setTitle("Settings");
    animationOptions.addCheckbox("auto repeat", false, (v) => { settings.autoRepeat = v; });
    animationOptions.addOption("easings", [...Object.keys(easings)], "linear", (v) => { settings.easing = easings[v]; });
    animationOptions.addEditableText("time", settings.animationTime, (v) => { settings.animationTime = v; });
    animationOptions.addEditableText("anim. name", "example", (v) => { settings.name = v; });

    const animations = addUIBox(280, 400, finishState.pos.sub(320, 0), "up");
    animations.setTitle("Animations");

    // Animation's Timeline
    const timeline = addUIBox(width() - 570, 280, vec2(570 / 2, height() - 300), "down");

    for (let i = 0; i < currentAnimation.frames.length; i++) {
        timeline.add([
            pos(10 + 50 * get("timelineFrame").length, 40),
            fixed(),
            rect(50, 20),
            color(THEME_COLOR),
            outline(0),
            area(),
            "boxElement",
            "timelineFrame",
            {
                selected: i == 0,

                update() {
                    if (this.selected) this.use(outline(2));
                    else this.use(outline(0));
                }
            }
        ]);
    }

    // add button
    const addBtn = timeline.add([
        pos(0),
        fixed(),
        text("+", { size: 34 }),
        color(THEME_COLOR),
        area(),
    ]);

    onUpdate(() => {
        // put in in the front of the latest timeline frame
        addBtn.pos = vec2(get("timelineFrame")[0]?.pos).add(50, 0);
    });


    // Play button
    const playButton = add([
        pos(center().x, 40),
        fixed(),
        sprite("playbutton"),
        anchor("center"),
        area(),
    ]);
    // #endregion

    playButton.onClick(() => {
        if (isInPlay) resetAnimation();
        else playAnimation();
    });

    playButton.onUpdate(() => {
        if (isInPlay) {
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

    // Sprite
    const buddy = add([
        pos(center()),
        z(10),
        anchor("center"),
    ]);

    const buddySprite = buddy.add([
        anchor("center"),
        sprite("bean"),
    ]);

    const buddyOrigin = buddy.add([
        pos(0, 0),
        anchor("center"),
        fixed(),
        rect(20, 20),
        color(THEME_COLOR),
        area(),
        drag(),
        opacity(0),
    ]);

    buddyOrigin.add([
        anchor("center"),
        fixed(),
        rect(30, 2),
        color(THEME_COLOR),
        opacity(0),
    ]);

    buddyOrigin.add([
        anchor("center"),
        fixed(),
        rect(2, 30),
        color(THEME_COLOR),
        opacity(0),
    ]);

    // Timeline
    const animationBar = add([
        pos(0, height()),
        anchor("botleft"),
        fixed(),
        rect(0, 0),
        color(THEME_COLOR),
    ]);

    // #region Input
    onKeyPress("s", () => {
        if (isKeyDown("shift")) saveAnimation();
    });

    onKeyPress("space", () => {
        if (isInPlay) resetAnimation();
        else playAnimation();
    });

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

    onMousePress(() => {
        if (curDraggin) return;

        for (const obj of get("drag", { recursive: true })) {
            if (obj.isHovering()) {
                obj.pick();
                break;
            }
        }
    });

    onMouseRelease(() => {
        if (curDraggin) {
            curDraggin.trigger("dragEnd");
            curDraggin = null;
        }
    });

    onUpdate(() => {
        // set props in sprite
        if (isInPlay) {
            buddySprite.use(scale(playingProps.scaleX, playingProps.scaleY));
            buddySprite.use(rotate(playingProps.rotation));
            buddySprite.use(opacity(playingProps.opacity));
        }
        else {
            buddySprite.use(scale(initialProps.scaleX, initialProps.scaleY));
            buddySprite.use(rotate(initialProps.rotation));
            buddySprite.use(opacity(initialProps.opacity));
        }

        // buddySprite.use(anchor(toWorld(buddyOrigin.pos)));
        animationBar.use(rect(animationTranscurredTime * width(), 5));
    });

    // animation controller
    function playAnimation() {
        if (isInPlay) return;

        isInPlay = true;

        for (const prop of props) {
            const t = tween(initialProps[prop.name], finishProps[prop.name], settings.animationTime, (v) => { playingProps[prop.name] = v; }, settings.easing);
            tweenings.push(t);
        }

        let t = tween(0, 1, settings.animationTime, (v) => { animationTranscurredTime = v; }, easings.linear);
        t.onEnd(() => {
            isInPlay = false;

            if (settings.autoRepeat) return playAnimation();
            else resetAnimation();
        });

        tweenings.push(t);
    }

    function resetAnimation() {
        isInPlay = false;

        for (const tween of tweenings) {
            tween.cancel();
        }

        tweenings = [];
        playingProps.scaleX = initialProps.scaleX;
        playingProps.scaleY = initialProps.scaleY;
        playingProps.rotation = initialProps.rotation;
        animationTranscurredTime = 0;
    }

    function saveAnimation() {
        let animData = {
            initialProps,
            finishProps,
        };

        downloadText(`${settings.name}.kanim`, JSON.stringify(animData));
    }
});

go("editor", project, initialProps, finishProps);
