import * as K from "kaboom";

// TODO: Many anys here, fix them
export interface KanimPlayCtx {
    kanimAnimation(animations: any): KanimAnimationComp;
}

export interface KanimAnimationComp extends K.Comp {
    _runningTweens: K.TweenController[];
    isPlaying: boolean;
    animations: any;

    kmPlay(anim: string | number): void;
    kmStop(): void;
}

export default function kanimPlugin(k: K.KaboomCtx) {
    let animations = {};

    return {
        async loadAnimation(name: string, path: string) {
            const animJSON = await k.loadJSON(name, path);
            const animData = animJSON.data;

            animations[name] = animData;
        },

        kanimAnimation(animations) {
            let playingProps: any = {};
            let runningTweens: K.TweenController[] = [];

            return {
                id: "kanimAnimation",
                require: ["sprite"],

                _runningTweens: runningTweens,
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
                            animation = this.animations.find((a: any) => a.name == anim);
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
                            let tw = k.tween(
                                playingProps[prop],
                                animation.frames[frame].finishProps[prop],
                                animation.frames[frame].settings.time,
                                (v) => { playingProps[prop] = v; },
                                animation.frames[frame].settings.easing
                            );

                            runningTweens.push(tw);
                        }
                    }

                    for (let i = 0; i < animation.frames.length; i++) {
                        k.wait(animation.frames[i - 1]?.settings?.time ?? 0, () => {
                            runFrame(i);
                            if (i == animation.frames.length - 1) {
                                k.wait(animation.frames[i].settings.time, () => {
                                    this.isPlaying = false;
                                });
                            }
                        });
                    }

                    this.isPlaying = true;
                },

                kmStop() {
                    for (const tween of runningTweens) {
                        tween.cancel();
                    }

                    this.isPlaying = false;
                    runningTweens = [];
                }
            };
        }
    };
}
