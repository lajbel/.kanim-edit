// functions to add boxes
function boxComp() {
    return {
        setTitle(t) {
            this.get("boxTitle")[0].text = t;
        },

        addEditableText(t, defaultValue, setter) {
            const quote = this.add([
                pos(6, 50 + (24 * this.get("boxElement").length)),
                anchor("left"),
                fixed(),
                text(t, { size: 20 }),
                color(BLACK),
                "boxElement",
            ]);

            const editableText = this.add([
                pos(quote.pos.add(140, 0)),
                anchor("left"),
                fixed(),
                "boxEditableText",
                {
                    set(v) {
                        setter(v);
                    }
                }
            ]);

            editableText.textValue = editableText.add([
                z(10),
                anchor("left"),
                fixed(),
                text(String(defaultValue), { size: 20 }),
                color(BLACK),
            ]);

            editableText.background = editableText.add([
                pos(-2, 0),
                z(5),
                anchor("left"),
                fixed(),
                rect(58, 20),
                color(120, 117, 117),
            ]);

            editableText.onUpdate(() => {
                editableText.use(area({ shape: new Rect(vec2(0), editableText.background.width, editableText.background.height) }));

                if (editableText.is("editingText")) {
                    editableText.set(editableText.textValue.text);
                    editableText.background.use(outline(2));
                }
                else {
                    editableText.background.use(outline(0.01));
                }

                if (editableText.textValue.width > editableText.background.width) {
                    editableText.background.use(rect(editableText.textValue.width + 4, 20));
                }
            });

            onMousePress(() => {
                if (editableText.hasPoint(mousePos())) {
                    editableText.use("editingText");
                }
                else {
                    editableText.unuse("editingText");
                }
            });

            onCharInput((ch) => {
                if (!editableText.is("editingText")) return;

                editableText.textValue.text += ch;
            });

            onKeyPressRepeat("backspace", () => {
                if (!editableText.is("editingText")) return;

                editableText.textValue.text = editableText.textValue.text.substring(0, editableText.textValue.text.length - 1)
            });
        },

        addCheckbox(t, defaultValue, action) {
            const quote = this.add([
                pos(6, 30 + (24 * this.get("boxElement").length)),
                anchor("left"),
                fixed(),
                text(t, { size: 20 }),
                color(BLACK),
                "boxElement",
            ]);

            const checkbox = add([
                pos(this.pos.add(quote.pos).add(160, 0)),
                z(60),
                anchor("center"),
                fixed(),
                rect(20, 20),
                color(255, 255, 255),
                outline(2),
                area({ scale: 1.2 }),
                "boxCheckbox",
                {
                    status: defaultValue ?? false,
                    setStatus: null,
                    action,
                }
            ]);

            const mark1 = add([
                pos(checkbox.pos),
                z(60),
                rotate(45),
                anchor("center"),
                fixed(),
                rect(2, 20),
                color(BLACK),
                opacity(defaultValue ? 1 : 0),
            ]);

            const mark2 = add([
                pos(checkbox.pos),
                z(60),
                rotate(-45),
                anchor("center"),
                fixed(),
                rect(2, 20),
                color(BLACK),
                opacity(defaultValue ? 1 : 0),
            ]);

            checkbox.setStatus = (v) => {
                checkbox.status = v;

                if (v) {
                    mark1.use(opacity(1));
                    mark2.use(opacity(1));
                }
                else {
                    mark1.use(opacity(0));
                    mark2.use(opacity(0));
                }
            }

            checkbox.onClick(() => {
                checkbox.setStatus(!checkbox.status);
                checkbox.action(checkbox.status);
            });
        },

        addOption(t, options, defaultValue, action) {
            let optionIndex = 0;

            const quote = this.add([
                pos(6, 30 + (24 * this.get("boxElement").length)),
                anchor("left"),
                fixed(),
                text(t, { size: 20 }),
                color(BLACK),
                "boxElement",
            ]);

            const selected = add([
                pos(this.pos.add(quote.pos).add(120, 0)),
                z(60),
                anchor("left"),
                fixed(),
                text(defaultValue, { size: 20 }),
                color(BLACK),
                {
                    selected: defaultValue ?? false,
                    setStatus: null,
                    action,
                }
            ]);

            const rightArrow = add([
                pos(selected.pos.add(170, 0)),
                z(60),
                anchor("center"),
                fixed(),
                text(">", { size: 30 }),
                color(BLACK),
                opacity(defaultValue ? 1 : 0),
                area(),
                "boxArrow",
            ]);

            const leftArrow = add([
                pos(selected.pos.sub(10, 0)),
                z(60),
                anchor("center"),
                fixed(),
                text("<", { size: 30 }),
                color(BLACK),
                opacity(defaultValue ? 1 : 0),
                area(),
                "boxArrow",
            ]);

            selected.setStatus = (v) => {
                selected.status = v
            }

            leftArrow.onClick(() => {
                optionIndex = optionIndex - 1 % options.lenght;
                selected.text = options[optionIndex];
                action(options[optionIndex]);
            });

            rightArrow.onClick(() => {
                optionIndex = optionIndex + 1 % options.length
                selected.text = options[optionIndex];
                action(options[optionIndex]);
            });

            // checkbox.onClick(() => {
            //     checkbox.setStatus(!checkbox.status);
            //     checkbox.action(checkbox.status);
            // });
        }
    }
}

export function addUIBox(w, h, p) {
    let center = vec2(w / 2, h / 2);

    const box = add([
        pos(p),
        z(50),
        fixed(),
        boxComp(),
    ]);

    box.add([
        fixed(),
        rect(w, h),
        outline(4),
    ]);

    box.add([
        pos(center.x, 20),
        anchor("center"),
        fixed(),
        text(""),
        color(BLACK),
        "boxTitle",
        "boxElement",
    ]);

    return box;
}