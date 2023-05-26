export default function kanimPlugin(k) {
    return {
        loadAnimation() {

        },

        kanimAnimation(animations) {
            playingProps = {};

            return {
                id: "kanimAnimation",
                require: ["sprite"],

                isPlaying: false,
                animations: animations,

                update() {
                    if (this.isPlaying) {
                        this.use(scale(playingProps.scaleX, playingProps.scaleY));
                        this.use(rotate(playingProps.rotation));
                        this.use(opacity(playingProps.opacity));
                    }
                },

                kmPlay(anim) {
                    let animation = null;

                    if (typeof anim == "string") {
                        animation = this.animations.find((a) => a.name == anim);
                    }
                    else {
                        animation = this.animations[anim];
                    }

                    // execute tweens
                    for (const prop of Object.keys(animation.frames[0].startProps)) {
                        tween(
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
