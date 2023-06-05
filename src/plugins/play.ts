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
    let animations = {};

    return {
        async loadAnimation(name:string, path: string) {
            const animJSON = await k.loadJSON(name, path);
            const animData = animJSON.data;

            animations[name] = animData;
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
                    let currentFrame = 0;
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

                    playingProps = animation.frames[0].startProps;

                    function runFrame(frame: number) {
                        for (const prop of Object.keys(animation.frames[frame].startProps)) {
                            k.tween(
                                playingProps[prop],
                                animation.frames[frame].finishProps[prop],
                                animation.frames[frame].settings.time,
                                (v) => { playingProps[prop] = v; },
                                animation.frames[frame].settings.easing
                            );
                        }
                    }

                    for (let i = 0; i < animation.frames.length; i++) {
                        k.wait(animation.frames[i - 1]?.settings?.time ?? 0, () => {
                            runFrame(i);
                        });
                    }

                    this.isPlaying = true;
                }
            };
        }
    };
}
