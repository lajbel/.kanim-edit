export default function layerPlugin(k) {
	let userLayers = [];
	let defLayer = "";
	let _add = k.add;

	return {
		layers(layersArr, def) {
			userLayers = layersArr;
			// less errors
			defLayer = def ?? layersArr[0];
		},

		layer(name) {
			let layerIndex = 0;

			return {
				id: "layer",
				add() {
					if (userLayers.indexOf(name) == -1) {
						throw new Error(`no layer "${name}"`);
					}

					let layerZ = userLayers.indexOf(name);

					// instead of .use(z()) component, only set .z
					this.z = (layerZ * 1000) + (this.userZ ?? 0);
				},
				inspect() {
					return name;
				}
			};
		},

		z(z) {
			return {
				id: "z",
				userZ: z,
			};
		},

		add(components) {
			// this for avoid error if there's no layers defined
			if (userLayers.length == 0) return _add([...components]);

			return _add([
				layer(defLayer),
				...components
			]);
		},
	};
}
