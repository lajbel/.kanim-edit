import type * as Kaboom from "kaboom";
import type { KanimPlayCtx } from "./plugins/play";
import type { ReturnLayerCtx } from "./plugins/layer";
import type { KanimUIContext } from "./uistuff";

export type GameCtx = Kaboom.KaboomCtx & KanimUIContext & ReturnLayerCtx & KanimPlayCtx;
