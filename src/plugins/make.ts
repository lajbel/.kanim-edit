import * as Kaboom from "kaboom";

export interface ReturnMakeCtx {
	make<T>(comps: Kaboom.CompList<T>): Kaboom.GameObj<T>;
}

export default function returnMake(k: Kaboom.KaboomCtx) {
	return {
		make<T>(comps: Kaboom.CompList<T>): Kaboom.GameObj<T> {
			const gameObject = k.add(comps);
			gameObject.destroy(); // remove from parent
			return gameObject;
		}
	};
}
