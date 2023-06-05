import type * as Kaboom from "kaboom";
import type { KanimPlayCtx } from "./play";
import type { ReturnLayerCtx } from "./plugins/layer";
import type { KanimUIContext } from "./ui";

export type GameCtx = Kaboom.KaboomCtx & KanimUIContext & ReturnLayerCtx & KanimPlayCtx;
