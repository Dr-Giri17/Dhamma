# Voice mode

`/voice` always supports typed questions. When available, it also uses browser-native APIs:

- `SpeechRecognition` or `webkitSpeechRecognition` for input;
- `speechSynthesis` and `SpeechSynthesisUtterance` for playback.

No external STT or TTS service is used.

## Controls

- choose RU, EN, or ID voice locale independently from interface language;
- start, stop, or cancel recognition;
- inspect and edit the live/final transcript;
- submit with the button or Ctrl/Cmd+Enter;
- play, pause/resume, stop, or replay the answer.

The status region uses `aria-live`, result focus moves to the answer, controls are native keyboard-operable elements, and reduced-motion styling is respected. Unsupported recognition, denied permission, missing microphone, no speech, network errors, empty transcripts, unsupported TTS, and playback failure all produce visible states. There is no silent failure.

Only `answer.answer` is spoken. Citation IDs, license metadata, and warnings are not narrated as spiritual content; they remain visible beside direct excerpts and source links.

## Browser limitations

Recognition support and voice quality vary by browser/OS. Some implementations use browser-vendor network services. The app cannot guarantee a particular installed voice, microphone policy, or offline recognition. Text input remains the reliable fallback.
