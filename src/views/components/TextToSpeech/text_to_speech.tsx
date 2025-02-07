import React from "react";
import { useSpeech } from "react-text-to-speech";

type TextToSpeechProps = {
  lang?: string;
  voiceURI?: string;
};

export default function TextToSpeech({
  lang = "en-US",
  voiceURI = "",
  children,
}: TextToSpeechProps & React.PropsWithChildren) {
  let text = "";
  if (typeof children === "string") {
    text = children;
  }

  const { Text, start, stop, pause, speechStatus, isInQueue } = useSpeech({
    text: text,
    lang: lang,
    voiceURI: voiceURI
  });

  return (
    <a style={{ cursor: "pointer" }} onClick={start}>
      {children}
    </a>
  );
}
