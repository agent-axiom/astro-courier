export type AudioTogglePresentation = {
  label: string;
  title: string;
  icon: "volume" | "muted";
};

export function buildAudioTogglePresentation(muted: boolean): AudioTogglePresentation {
  return muted
    ? {
        label: "Unmute audio",
        title: "Unmute audio",
        icon: "muted"
      }
    : {
        label: "Mute audio",
        title: "Mute audio",
        icon: "volume"
      };
}
