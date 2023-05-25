export function drag() {
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
