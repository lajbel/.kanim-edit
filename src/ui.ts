import * as K from "kaboom";
import { ReturnLayerCtx } from "./plugins/layer";
import { GameCtx } from "./types";

// #region Types
export interface KanimUIContext {
    uiBox(): BoxComp;
    uiInputField(this: KanimUIContext): InputFieldComp;
    uiMakeInputField(this: KanimUIContext, defaultValue: string): K.GameObj<InputFieldComp>;
    uiAddBox(this: KanimUIContext, width: number, height: number, side: K.Anchor): K.GameObj<BoxComp | K.PosComp>;
}

interface BoxComp extends K.Comp {
    toggleView(): void;
    addTitle(title: string): void;
    addElement<T>(title: string, element: K.GameObj<T>): K.GameObj<T>;
}

interface InputFieldComp extends K.Comp {
    editableText: K.GameObj<any>;

    onInputSet(action: (v: string) => void): void;
}
// #endregion

// #region Plugin
export default function kanimUI(k: GameCtx) {
    function autoAlign(obj, align: string, boxDimensions: K.Vec2) {
        const w = boxDimensions.x;
        const h = boxDimensions.y;

        const alignsToVec2 = {
            "left": k.vec2(0, (k.height() / 2) + (h / 2)),
            "topleft": k.vec2(0, 0),
            "botleft": k.vec2(0, k.height() - h),
            "right": k.vec2(k.width() - w, (k.height() / 2) + (h / 2)),
            "topright": k.vec2(k.width() - w, 0),
            "botright": k.vec2(k.width() - w, k.height() - h / 2),
            "top": k.vec2((k.width() / 2) - (w / 2), 0),
            "bot": k.vec2((k.width() / 2) - (w / 2), k.height() - h / 2),
        };

        obj.pos = alignsToVec2[align];
    }

    return {
        // #region Components
        uiBox() {
            let initPos: K.Vec2;
            let hidden = false;

            return {
                add() {
                    initPos = this.pos.clone();
                },
                toggleView(dir: "up" | "down" | "left" | "right") {
                    let dirs = {
                        up: { xy: "y", v: 1, s: "height" },
                        down: { xy: "y", v: -1, s: "height" },
                        left: { xy: "x", v: 1, s: "width" },
                        right: { xy: "x", v: -1, s: "width" },
                    };

                    if (hidden) {
                        k.tween(this.pos[dirs[dir].xy], initPos[dirs[dir].xy], 1, (v) => { this.pos[dirs[dir].xy] = v; }, k.easings.easeInOutBack);
                    }
                    else {
                        k.tween(this.pos[dirs[dir].xy], dirs[dir].v < 0 ? window[dirs[dir].s]() - 10 : 0 - this.bg[dirs[dir].s], 1, (v) => { this.pos[dirs[dir].xy] = v; }, k.easings.easeInOutBack);
                    }

                    hidden = !hidden;
                },
                addTitle(title: string) {
                    this.add([
                        k.pos(6, 24 + (24 * this.get("boxElement").length)),
                        k.anchor("left"),
                        k.fixed(),
                        k.text(title, { size: 30 }),
                        k.color(k.BLACK),
                        "boxTitle",
                        "boxElement",
                    ]);
                },
                addElement<T>(this: K.GameObj<unknown>, title: string, element: K.GameObj<T>) {
                    const quote = this.add([
                        // TODO: hardcoded
                        k.pos(6, 28 + (24 * this.get("boxElement").length)),
                        k.anchor("left"),
                        k.fixed(),
                        k.text(title, { size: 20 }),
                        k.color(k.BLACK),
                        "boxElement",
                    ]);

                    const e = quote.add(element);
                    // TODO: hardcoded
                    e.use(k.pos(120, 0));

                    return e;
                },

                // addCheckbox(t, defaultValue, action) {
                //     const quote = this.addQuote(t);

                //     const checkbox = this.add([
                //         pos(quote.pos.add(160, 0)),
                //         z(60),
                //         anchor("center"),
                //         fixed(),
                //         rect(20, 20),
                //         color(255, 255, 255),
                //         outline(2),
                //         area({ scale: 1.2 }),
                //         "boxCheckbox",
                //         {
                //             status: defaultValue ?? false,
                //             setStatus: null,
                //             action,
                //         }
                //     ]);

                //     const mark1 = this.add([
                //         pos(checkbox.pos),
                //         z(60),
                //         rotate(45),
                //         anchor("center"),
                //         fixed(),
                //         rect(2, 20),
                //         color(BLACK),
                //         opacity(defaultValue ? 1 : 0),
                //     ]);

                //     const mark2 = this.add([
                //         pos(checkbox.pos),
                //         z(60),
                //         rotate(-45),
                //         anchor("center"),
                //         fixed(),
                //         rect(2, 20),
                //         color(BLACK),
                //         opacity(defaultValue ? 1 : 0),
                //     ]);

                //     checkbox.setStatus = (v) => {
                //         checkbox.status = v;

                //         if (v) {
                //             mark1.use(opacity(1));
                //             mark2.use(opacity(1));
                //         }
                //         else {
                //             mark1.use(opacity(0));
                //             mark2.use(opacity(0));
                //         }
                //     };

                //     checkbox.onClick(() => {
                //         checkbox.setStatus(!checkbox.status);
                //         checkbox.action(checkbox.status);
                //     });
                // },

                // addRadiusList(options, defaultValue, action) {
                //     let selectedOption;
                // },

                // addOption(t, options, defaultValue, action, arrow) {
                //     let optionIndex = 0;

                //     const quote = this.addQuote(t);

                //     const selected = this.add([
                //         pos(quote.pos.add(120, 0)),
                //         z(60),
                //         anchor("left"),
                //         fixed(),
                //         text(defaultValue, { size: 20 }),
                //         color(BLACK),
                //         {
                //             selected: defaultValue ?? false,
                //             setStatus: null,
                //             action,
                //         }
                //     ]);


                //     const rightArrow = this.add([
                //         pos(selected.pos.add(170, 0)),
                //         z(60),
                //         anchor("center"),
                //         fixed(),
                //         text(">", { size: 30 }),
                //         color(BLACK),
                //         opacity(defaultValue ? 1 : 0),
                //         area(),
                //         "boxArrow",
                //     ]);

                //     const leftArrow = this.add([
                //         pos(selected.pos.sub(10, 0)),
                //         z(60),
                //         anchor("center"),
                //         fixed(),
                //         text("<", { size: 30 }),
                //         color(BLACK),
                //         opacity(defaultValue ? 1 : 0),
                //         area(),
                //         "boxArrow",
                //     ]);

                //     selected.setStatus = (v) => {
                //         selected.status = v;
                //     };

                //     leftArrow.onClick(() => {
                //         optionIndex = optionIndex - 1 % options.lenght;
                //         selected.text = options[optionIndex];
                //         action(options[optionIndex]);
                //     });

                //     rightArrow.onClick(() => {
                //         optionIndex = optionIndex + 1 % options.length;
                //         selected.text = options[optionIndex];
                //         action(options[optionIndex]);
                //     });

                // checkbox.onClick(() => {
                //     checkbox.setStatus(!checkbox.status);
                //     checkbox.action(checkbox.status);
                // });
            };
        },
        // #endregion

        uiInputField() {
            return {
                id: "uiInputField",
                editableText: null!,
                inputValue: "",

                setValue(newValue: unknown) {
                    this.editableText.text = String(newValue);
                    this.inputValue = String(newValue);
                    this.trigger("inputSet", newValue);
                },

                onInputSet(action: (v) => void) {
                    this.on("inputSet", action);
                },
            };
        },

        // #region Makers
        uiMakeInputField(defaultValue: string) {
            const inputText = k.make([
                k.pos(0),
                k.layer("ui"),
                k.anchor("left"),
                k.fixed(),
                this.uiInputField(),
                {
                    background: null as unknown as K.GameObj<unknown> | undefined,
                }
            ]);

            const editableText = inputText.editableText = inputText.add([
                k.z(10),
                k.layer("ui"),
                k.anchor("left"),
                k.fixed(),
                k.text(String(defaultValue), { size: 20 }),
                k.color(k.BLACK),
                k.area(),
            ]);

            inputText.background = inputText.add([
                k.pos(-2, 0),
                k.z(5),
                k.layer("ui"),
                k.anchor("left"),
                k.fixed(),
                k.rect(58, 20),
                k.color(120, 117, 117),
            ]);

            const inputBackground = inputText.background;

            editableText.onUpdate(() => {
                editableText.use(k.area({ shape: new k.Rect(k.vec2(0), inputBackground.width, inputBackground.height) }));

                if (editableText.is("editing_input")) {
                    inputBackground.use(k.outline(2));
                }
                else {
                    inputBackground.use(k.outline(0.01));
                }

                if (editableText.width > inputBackground.width) {
                    inputBackground.use(k.rect(editableText.width + 4, 20));
                }
            });

            k.onMousePress(() => {
                if (editableText.hasPoint(k.mousePos())) {
                    editableText.use("editing_input");
                }
                else {
                    editableText.unuse("editing_input");
                    inputText.trigger("inputSet", editableText.text);
                }
            });

            k.onCharInput((ch) => {
                if (!editableText.is("editing_input")) return;

                editableText.text += ch;
            });

            k.onKeyPressRepeat("backspace", () => {
                if (!editableText.is("editing_input")) return;

                editableText.text = editableText.text.substring(0, editableText.text.length - 1);
            });

            return inputText;
        },
        uiMakeButton(text: string, action: () => void) {
            const button = k.make([
                k.pos(0),
                k.layer("ui"),
                k.anchor("left"),
                k.fixed(),
                k.area(),
                k.anchor("center"),
                k.rect(100, 30),
            ]);

            const buttonText = button.add([
                k.pos(0),
                k.text(text, { size: 18 }),
                k.color(k.BLACK),
            ]);

            button.onClick(action);

            return button;
        },
        // #endregion

        // #region Adders
        uiAddBox(width: number, height: number, side: K.Anchor) {
            let center = k.vec2(width / 2, height / 2);

            const arrows = {
                "right": {
                    icon: ">",
                    pos: k.vec2(-14, center.y),
                    anchor: "center",
                },
                "left": {
                    icon: "<",
                    pos: k.vec2(width + 14, center.y),
                    anchor: "center",
                },
                "up": {
                    icon: "^",
                    pos: k.vec2(center.x, height + 14),
                    anchor: k.vec2(0, -0.5),
                },
                "down": {
                    icon: "˅",
                    pos: k.vec2(center.x, -14),
                    anchor: k.vec2(0, -0.5),
                },
            };

            const box = k.add([
                k.pos(),
                k.fixed(),
                k.layer("ui"),
                k.anchor("topleft"),
                this.uiBox(),
                { center: center, bg: null! as K.GameObj }
            ]);

            box.bg = box.add([
                k.fixed(),
                k.anchor("topleft"),
                k.rect(width, height),
                k.outline(4),
            ]);

            autoAlign(box, side, k.vec2(box.bg.width, box.bg.height));

            // const arrowObj = box.add([
            //     k.pos(arrows[side].pos),
            //     k.rotate(0),
            //     k.anchor(arrows[side].anchor),
            //     k.text(arrows[side].icon),
            //     k.color(BLACK),
            //     k.area(),
            //     k.fixed(),
            //     {
            //         side: side,
            //         rot() {
            //             tween(this.angle, this.angle + 180, 0.5, (v) => { this.angle = v; }, easings.easeInBack);
            //         }
            //     }
            // ]);

            // arrowObj.onClick(() => {
            //     box.toggle(arrowObj.side);
            //     arrowObj.rot();
            // });

            return box;
        }
        // #endregion
    };
}
