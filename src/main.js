import kaboom from "kaboom";
import "kaboom";
import { addUIBox } from "./uistuff";

const k = kaboom({
    background: [230, 211, 211],
    logMax: 10,
});

k.loadSprite("bean", "sprites/bean.png");
k.loadSprite("playbutton", "sprites/playbutton.png");

let curDraggin = null

// A custom component for handling drag & drop behavior
function drag() {
    // The displacement between object pos and mouse pos
    let offset = vec2(0)

    return {
        id: "drag",
        require: ["pos", "area"],
        pick() {
            curDraggin = this
            offset = toScreen(mousePos().sub(this.pos))
            this.trigger("drag")
        },

        update() {
            if (curDraggin === this) {
                this.pos = toScreen(mousePos().sub(offset))
                this.trigger("dragUpdate")
            }
        },
        onDrag(action) {
            return this.on("drag", action)
        },
        onDragUpdate(action) {
            return this.on("dragUpdate", action)
        },
        onDragEnd(action) {
            return this.on("dragEnd", action)
        },
    }

}

const THEME_COLOR = rgb(120, 127, 255);

let opts = {
    name: "example",
    autoRepeat: false,
    easing: easings.linear,
    animationTime: 1,
}

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
}

let animProps = {
    scaleX: 2,
    scaleY: 2,
    rotation: 0,
    opacity: 1,
}

scene("editor", (initialProps, animProps) => {
    let playing = false;
    let animationTranscurredTime = 0;
    let tweenings = [];

    let currentProps = { ...initialProps }

    // UI Boxes
    const initialState = addUIBox(230, height() - 20, vec2(10, 10), "left");
    const finishState = addUIBox(230, height() - 20, vec2(width() - 240, 10), "right");

    initialState.setTitle("Initial")
    finishState.setTitle("Modify");

    for (const prop of props) {
        if (prop.type == "editableNumber") {
            initialState.addEditableText(prop.name, initialProps[prop.name], (v) => { initialProps[prop.name] = Number(v) });
            finishState.addEditableText(prop.name, animProps[prop.name], (v) => { animProps[prop.name] = Number(v) })
        }
    }

    const animationOptions = addUIBox(400, 230, vec2(initialState.pos.add(260, 0)), "up");
    animationOptions.setTitle("Settings");
    animationOptions.addCheckbox("auto repeat", false, (v) => { opts.autoRepeat = v });
    animationOptions.addOption("easings", [
        ...Object.keys(easings)
    ], "linear", (v) => { opts.easing = easings[v] });
    animationOptions.addEditableText("time", opts.animationTime, (v) => { opts.animationTime = v });
    animationOptions.addEditableText("anim. name", "example", (v) => { opts.name = v });

    const animations = addUIBox(280, 400, finishState.pos.sub(320, 0), "up");
    animations.setTitle("Animations");

    // Animation's Timeline
    const timeline = addUIBox(width() - 570, 280, vec2(570 / 2, height() - 300), "down");



    // Play button
    const playButton = add([
        pos(center().x, 40),
        fixed(),
        sprite("playbutton"),
        anchor("center"),
        area(),
    ]);

    playButton.onClick(() => {
        if (playing) resetAnimation();
        else playAnimation();
    });

    playButton.onUpdate(() => {
        if (playing) {
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

    // keys
    onKeyDown("w", () => {
        camScale(camScale().add(vec2(dt())));
    });

    onKeyDown("s", () => {
        camScale(camScale().sub(vec2(dt())));
    });

    onKeyPress("tab", () => {
        saveAnimation();
    });

    onKeyPress("space", () => {
        if (playing) resetAnimation();
        else playAnimation();
    });

    onMousePress(() => {
        if (curDraggin) return;

        for (const obj of get("drag", { recursive: true })) {
            if (obj.isHovering()) {
                obj.pick()
                break
            }
        }
    })

    onMouseRelease(() => {
        if (curDraggin) {
            curDraggin.trigger("dragEnd")
            curDraggin = null
        }
    })

    onUpdate(() => {
        // set props in sprite
        if (playing) {
            buddySprite.use(scale(currentProps.scaleX, currentProps.scaleY));
            buddySprite.use(rotate(currentProps.rotation));
            buddySprite.use(opacity(currentProps.opacity))
        }
        else {
            buddySprite.use(scale(initialProps.scaleX, initialProps.scaleY));
            buddySprite.use(rotate(initialProps.rotation));
            buddySprite.use(opacity(initialProps.opacity))
        }

        // buddySprite.use(anchor(toWorld(buddyOrigin.pos)));
        animationBar.use(rect(animationTranscurredTime * width(), 5))
    });

    // animation controller
    function playAnimation() {
        if (playing) return;

        playing = true;

        for (const prop of props) {
            const t = tween(initialProps[prop.name], animProps[prop.name], opts.animationTime, (v) => { currentProps[prop.name] = v }, opts.easing);
            tweenings.push(t);
        }

        let t = tween(0, 1, opts.animationTime, (v) => { animationTranscurredTime = v }, easings.linear);
        t.onEnd(() => {
            playing = false;

            if (opts.autoRepeat) return playAnimation();
            else resetAnimation();
        });

        tweenings.push(t);
    }

    function resetAnimation() {
        playing = false;

        for (const tween of tweenings) {
            tween.cancel();
        }

        tweenings = [];
        currentProps.scaleX = initialProps.scaleX;
        currentProps.scaleY = initialProps.scaleY;
        currentProps.rotation = initialProps.rotation;
        animationTranscurredTime = 0;
    }

    function saveAnimation() {
        let animData = {
            initialProps,
            animProps,
        }

        downloadText(`${opts.name}.kanim`, JSON.stringify(animData));
    }
});

go("editor", initialProps, animProps);
