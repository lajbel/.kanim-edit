import * as K from "kaboom";

// TODO: Many anys here, fix them
export interface KanimPlayCtx {
    kanimAnimation(animations: any): KanimAnimationComp;
}

export interface KanimAnimationComp extends K.Comp {
    isPlaying: boolean;
    animations: any;

    kmPlay(anim: string | number): void;
}

export default function kanimPlugin(k: K.KaboomCtx) {
    return {
        loadAnimation() {

        },

        kanimAnimation(animations) {
            let playingProps: any = {};

            return {
                id: "kanimAnimation",
                require: ["sprite"],

                isPlaying: false,
                animations: animations,

                update() {
                    if (this.isPlaying) {
                        this.use(k.scale(playingProps.scaleX, playingProps.scaleY));
                        this.use(k.rotate(playingProps.rotation));
                        this.use(k.opacity(playingProps.opacity));
                    }
                },

                kmPlay(anim: string | number) {
                    let animation: any;

                    switch (typeof anim) {
                        case "string":
                            animation = this.animations.find((a) => a.name == anim);
                            break;
                        case "number":
                            animation = this.animations[anim];
                            break;
                        default:
                            animation = null;
                    }

                    if (animation == null) return;

                    // execute tweens for each property
                    for (const prop of Object.keys(animation.frames[0].startProps)) {
                        k.tween(
                            animation.frames[0].startProps[prop],
                            animation.frames[0].finishProps[prop],
                            animation.frames[0].settings.time,
                            (v) => { playingProps[prop] = v; },
                            animation.frames[0].settings.easing
                        );
                    }

                    this.isPlaying = true;
                }
            };
        }
    };
}
