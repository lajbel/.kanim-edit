// functions to add boxes
function boxComp() {
    let initPos;
    let hidden = false;

    return {
        add() {
            initPos = this.pos.clone();
        },

        toggle(dir) {
            let dirs = {
                up: { xy: "y", v: 1, s: "height" },
                down: { xy: "y", v: -1, s: "height" },
                left: { xy: "x", v: 1, s: "width" },
                right: { xy: "x", v: -1, s: "width" },
            };

            if (hidden) {
                tween(this.pos[dirs[dir].xy], initPos[dirs[dir].xy], 1, (v) => { this.pos[dirs[dir].xy] = v; }, easings.easeInOutBack);
            }
            else {
                tween(this.pos[dirs[dir].xy], dirs[dir].v < 0 ? window[dirs[dir].s]() - 10 : 0 - this.bg[dirs[dir].s], 1, (v) => { this.pos[dirs[dir].xy] = v; }, easings.easeInOutBack);
            }

            hidden = !hidden;
        },

        addQuote(t) {
            const quote = this.add([
                pos(6, 50 + (24 * this.get("boxElement").length)),
                anchor("left"),
                fixed(),
                text(t, { size: 20 }),
                color(BLACK),
                "boxElement",
            ]);

            return quote;
        },

        addTitle(t, align) {
            this.add([
                pos(this.center.x, 30),
                anchor(align),
                fixed(),
                text(t, { align: align, size: 28 }),
                color(BLACK),
                "boxTitle",
                "boxElement",
            ]);
        },

        addEditableText(t, defaultValue, setter) {
            const quote = this.addQuote(t);

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
                layer("ui"),
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

                editableText.textValue.text = editableText.textValue.text.substring(0, editableText.textValue.text.length - 1);
            });
        },

        addCheckbox(t, defaultValue, action) {
            const quote = this.addQuote(t);

            const checkbox = this.add([
                pos(quote.pos.add(160, 0)),
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

            const mark1 = this.add([
                pos(checkbox.pos),
                z(60),
                rotate(45),
                anchor("center"),
                fixed(),
                rect(2, 20),
                color(BLACK),
                opacity(defaultValue ? 1 : 0),
            ]);

            const mark2 = this.add([
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
            };

            checkbox.onClick(() => {
                checkbox.setStatus(!checkbox.status);
                checkbox.action(checkbox.status);
            });
        },

        addRadiusList(options, defaultValue, action) {
            let selectedOption;


        },

        addOption(t, options, defaultValue, action, arrow) {
            let optionIndex = 0;

            const quote = this.addQuote(t);

            const selected = this.add([
                pos(quote.pos.add(120, 0)),
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


            const rightArrow = this.add([
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

            const leftArrow = this.add([
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
                selected.status = v;
            };

            leftArrow.onClick(() => {
                optionIndex = optionIndex - 1 % options.lenght;
                selected.text = options[optionIndex];
                action(options[optionIndex]);
            });

            rightArrow.onClick(() => {
                optionIndex = optionIndex + 1 % options.length;
                selected.text = options[optionIndex];
                action(options[optionIndex]);
            });

            // checkbox.onClick(() => {
            //     checkbox.setStatus(!checkbox.status);
            //     checkbox.action(checkbox.status);
            // });
        }
    };
}

export function addUIBox(w, h, p, arrow = "right", title) {
    let center = vec2(w / 2, h / 2);

    let arrows = {
        "right": {
            icon: ">",
            pos: vec2(-14, center.y),
            anchor: "center",
        },
        "left": {
            icon: "<",
            pos: vec2(w + 14, center.y),
            anchor: "center",
        },
        "up": {
            icon: "^",
            pos: vec2(center.x, h + 14),
            anchor: vec2(0, -0.5),
        },
        "down": {
            icon: "˅",
            pos: vec2(center.x, -14),
            anchor: vec2(0, -0.5),
        },
    };

    const box = add([
        pos(p),
        fixed(),
        layer("ui"),
        boxComp(),
        { center: center }
    ]);

    box.bg = box.add([
        fixed(),
        rect(w, h),
        outline(4),
    ]);

    const arrowObj = box.add([
        pos(arrows[arrow].pos),
        rotate(0),
        anchor(arrows[arrow].anchor),
        text(arrows[arrow].icon),
        color(BLACK),
        area(),
        fixed(),
        {
            side: arrow,
            rot() {
                tween(this.angle, this.angle + 180, 0.5, (v) => { this.angle = v; }, easings.easeInBack);
            }
        }
    ]);

    arrowObj.onClick(() => {
        box.toggle(arrowObj.side);
        arrowObj.rot();
    });

    box.addTitle(title ?? "", "center");

    return box;
}
