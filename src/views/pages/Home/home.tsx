//libraries
import React, { useCallback } from "react";
import {
  Button,
  Col,
  Dropdown,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { useVoices } from "react-text-to-speech";
import { ArrowClockwise } from "react-bootstrap-icons";
import { ToastContainer, toast } from "react-toastify";

//components
import Card from "../../components/Card/card.tsx";
import TextToSpeech from "../../components/TextToSpeech/text_to_speech.tsx";
import Skeleton from "../../components/Skeleton/skeleton.tsx";

//models, services
import GenerativeContentService from "../../../services/GenerativeContentService.ts";
import Sentence from "../../../models/Sentence.ts";

//css
import "./home.css";
import "../../styles/form.input.css";
import "../../components/Text/text.css";

//data
import topics from "../../../data/topics.json";
import exampleSentences from "../../../data/example_sentences.json";
import keys from "../../../data/keys.json";

//local constants
const GEMINI_KEY_NAME = "GEMINI_KEY_NAME";
const TOPICS_KEY_NAME = "TOPICS_KEY_NAME";
const VOICES_KEY_NAME = "VOICES_KEY_NAME";
const OPTIONS_KEY_NAME = "OPTIONS_KEY_NAME";

//code constants
const MAX_VOICE_NAME = 50;
const TOAST_TIME = 3000;

const GEMINI_LINK =
  "https://aistudio.google.com/app/u/4/apikey?_gl=1*8y5txt*_ga*MTMxMjQxOTY2Mi4xNzMxNDMwOTk5*_ga_P1DBVKWT6V*MTczODkwODQ1MS4xOC4xLjE3Mzg5MDg0NjkuNDIuMC4xMTIwNzQ0NjAx";

const TOAST_OPTIONS = {
  closeButton: true,
  autoClose: TOAST_TIME,
  hideProgressBar: false,
  style: { fontSize: 12 },
};

export default function HomePage() {
  //states
  //options
  const [isShownInformal, setShowingInformal] = React.useState(false);
  const [isShownFurigana, setShowingFurigana] = React.useState(false);
  const [isShownRomaji, setShowingRomaji] = React.useState(false);
  const [isShownMeaning, setShowingMeaning] = React.useState(false);

  // saving status
  const [canSaveOptions, setCanSaveOptions] = React.useState(false);
  const [canSaveTopics, setCanSaveTopics] = React.useState(false);
  const [canSaveVoicess, setCanSaveVoicess] = React.useState(false);

  //loading, checking, showing
  const [loading, setLoading] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [isShownModal, setShownModal] = React.useState(false);

  //data states
  const [activeTopics, setActiveTopics] = React.useState<number[]>([]);
  const [oldGeminiKeys, setOldGeminiKeys] = React.useState<string[]>([]);
  const [geminiKey, setGeminiKey] = React.useState("");
  const [activeGeminiKey, setActiveGeminiKey] = React.useState("");

  const { voices } = useVoices();
  const jaVoices = voices
    .filter((voice) => voice.lang === "ja-JP")
    .map((voice) => ({
      name:
        voice.name.length > MAX_VOICE_NAME
          ? voice.name.substring(0, MAX_VOICE_NAME) + "..."
          : voice.name,
      voiceURI: voice.voiceURI,
      lang: voice.lang,
    }));

  const subVoices = voices
    .filter((voice) => voice.lang === "en-US" || voice.lang === "vi-VN")
    .slice(-10)
    .map((voice) => ({
      name:
        voice.name.length > MAX_VOICE_NAME
          ? voice.name.substring(0, MAX_VOICE_NAME) + "..."
          : voice.name,
      voiceURI: voice.voiceURI,
      lang: voice.lang,
    }));

  //voices
  const [activeVoice, setActiveVoice] = React.useState(0);
  const [activeSubVoice, setActiveSubVoice] = React.useState<{
    index: number;
    lang: string;
  }>({ index: 0, lang: "en-US" });

  //sentences
  const [formalSentence, setFormalSentence] = React.useState<Sentence>(
    exampleSentences[0]
  );
  const [informalSentence, setInformalSentence] = React.useState<Sentence>(
    exampleSentences[1]
  );
  const [sentence, setSentence] = React.useState<Sentence | null>(null);

  //handlers
  const handleRefresh = useCallback(
    async (key?: string) => {
      setLoading(true);

      try {
        const results = await GenerativeContentService.getNewSentence(
          key ? key : activeGeminiKey,
          topics.filter((t) => activeTopics.includes(t.id)).map((t) => t.title)
        );

        setFormalSentence(results.formal);
        setInformalSentence(results.informal);

        setLoading(false);
      } catch (error) {
        console.log("Cannot refresh new sentences", error);

        const newActiveKey = keys.find(
          (key) => key !== activeGeminiKey && !oldGeminiKeys.includes(key)
        );

        if (newActiveKey) {
          setActiveGeminiKey(newActiveKey);
          handleRefresh(newActiveKey);
        }

        setOldGeminiKeys((prev) => [...prev, activeGeminiKey]);
        setLoading(false);
      }
    },
    [activeGeminiKey, activeTopics]
  );

  const handleCheckTopic = useCallback(
    (checked: boolean, id: number) => {
      const chosenTopics = activeTopics;
      if (checked && !chosenTopics.includes(id)) {
        setActiveTopics([...chosenTopics, id]);
      } else if (!checked) {
        setActiveTopics(chosenTopics.filter((t) => t !== id));
      }

      if (!canSaveTopics) {
        setCanSaveTopics(true);
      }
    },
    [activeTopics, canSaveTopics]
  );

  const handleSaveOptions = React.useCallback(() => {
    localStorage.setItem(
      OPTIONS_KEY_NAME,
      JSON.stringify({
        informal: isShownInformal,
        furigana: isShownFurigana,
        romaji: isShownRomaji,
        meaning: isShownMeaning,
      })
    );

    toast("Save Options Successfully!", {
      ...TOAST_OPTIONS,
      className: "text-info",
    });

    setCanSaveOptions(false);
  }, [isShownInformal, isShownFurigana, isShownRomaji, isShownMeaning]);

  const handleSaveTopics = useCallback(() => {
    localStorage.setItem(TOPICS_KEY_NAME, JSON.stringify(activeTopics));

    toast("Save Topics Successfully!", {
      ...TOAST_OPTIONS,
      className: "text-info",
    });

    setCanSaveTopics(false);
  }, [activeTopics]);

  const handleSaveVoices = useCallback(() => {
    localStorage.setItem(
      VOICES_KEY_NAME,
      JSON.stringify({
        main: activeVoice,
        sub: activeSubVoice,
      })
    );

    toast("Save Voices Successfully!", {
      ...TOAST_OPTIONS,
      className: "text-info",
    });

    setCanSaveVoicess(false);
  }, [activeVoice, activeSubVoice]);

  const handleSaveKey = useCallback(async () => {
    setChecking(true);

    if (!GenerativeContentService.checkAPIFormat(geminiKey)) {
      toast("Save Gemini Key Unsuccessfully. Invalid key :<", {
        ...TOAST_OPTIONS,
        className: "text-danger",
      });

      setChecking(false);
      setGeminiKey("");
      return;
    }

    if (keys.includes(geminiKey)) {
      toast("Save Gemini Key Unsuccessfully. Key's already existed :<", {
        ...TOAST_OPTIONS,
        className: "text-danger",
      });

      setChecking(false);
      setGeminiKey("");
      return;
    }

    const savedGeminiKeys = localStorage.getItem(GEMINI_KEY_NAME);
    if (savedGeminiKeys) {
      const parsedGeminiKeys: string[] = JSON.parse(savedGeminiKeys);

      if (parsedGeminiKeys.includes(geminiKey)) {
        toast("Save Gemini Key Unsuccessfully. Key's already existed :<", {
          ...TOAST_OPTIONS,
          className: "text-danger",
        });

        setChecking(false);
        setGeminiKey("");
        return;
      }
    }

    try {
      const result = await GenerativeContentService.checkAPIKey(geminiKey);

      if (result) {
        toast("Save Gemini Key Successfully!", {
          ...TOAST_OPTIONS,
          className: "text-info",
        });

        const keyStrings = localStorage.getItem(GEMINI_KEY_NAME);
        const keys: Array<string> = keyStrings ? JSON.parse(keyStrings) : [];

        keys.push(geminiKey);
        localStorage.setItem(GEMINI_KEY_NAME, JSON.stringify(keys));

        setShownModal(false);
      } else {
        toast("Save Gemini Key Unsuccessfully. Invalid key :<", {
          ...TOAST_OPTIONS,
          className: "text-danger",
        });
      }
    } catch (error) {
      console.log("Cannot check api key", error);

      toast("Save Gemini Key Unsuccessfully. Invalid key :<", {
        ...TOAST_OPTIONS,
        className: "text-danger",
      });
    } finally {
      setGeminiKey("");
      setChecking(false);
    }
  }, [geminiKey]);

  //processing
  React.useEffect(() => {
    //options
    const savedOptions = localStorage.getItem(OPTIONS_KEY_NAME);
    if (savedOptions) {
      const parsedOptions: {
        informal: boolean;
        furigana: boolean;
        romaji: boolean;
        meaning: boolean;
      } = JSON.parse(savedOptions);

      if (parsedOptions) {
        if (parsedOptions.informal) {
          setShowingInformal(parsedOptions.informal);
        }

        if (parsedOptions.furigana) {
          setShowingFurigana(parsedOptions.furigana);
        }

        if (parsedOptions.romaji) {
          setShowingRomaji(parsedOptions.romaji);
        }

        if (parsedOptions.meaning) {
          setShowingMeaning(parsedOptions.meaning);
        }
      }
    }

    //topics
    const savedTopics = localStorage.getItem(TOPICS_KEY_NAME);
    if (savedTopics) {
      const parsedTopics: number[] = JSON.parse(savedTopics);

      if (parsedTopics) {
        setActiveTopics(parsedTopics);
      }
    }

    //voices
    const savedVoices = localStorage.getItem(VOICES_KEY_NAME);
    if (savedVoices) {
      const parsedVoices: {
        main: number;
        sub: {
          index: number;
          lang: string;
        };
      } = JSON.parse(savedVoices);

      if (parsedVoices.main) {
        setActiveVoice(parsedVoices.main);
      }

      if (parsedVoices.sub && parsedVoices.sub.index && parsedVoices.sub.lang) {
        setActiveSubVoice(parsedVoices.sub);
      }
    }

    //gemini key
    const savedGeminiKeys = localStorage.getItem(GEMINI_KEY_NAME);
    if (savedGeminiKeys) {
      const parsedGeminiKeys: string[] = JSON.parse(savedGeminiKeys);

      const validGeminiKeys: string[] = [];

      parsedGeminiKeys.forEach((k) => {
        if (
          GenerativeContentService.checkAPIFormat(k) &&
          !validGeminiKeys.includes(k)
        ) {
          validGeminiKeys.push(k);
        }
      });

      localStorage.setItem(GEMINI_KEY_NAME, JSON.stringify(validGeminiKeys));

      if (validGeminiKeys.length === 0) {
        setActiveGeminiKey(keys[0]);
      } else {
        setActiveGeminiKey(validGeminiKeys[validGeminiKeys.length - 1]);
      }
    } else {
      setActiveGeminiKey(keys[0]);
    }
  }, []);

  React.useEffect(() => {
    handleRefresh();
  }, [activeGeminiKey]);

  React.useEffect(() => {
    setSentence(isShownInformal ? informalSentence : formalSentence);
  }, [isShownInformal, formalSentence, informalSentence]);

  //render
  return (
    <div className="home-page text-center">
      <div className="container">
        <Card>
          <div className="content-container">
            {/* skeletons for loading content */}
            {loading && (
              <>
                <Skeleton style={{ height: 55 }} className="w-100 mb-2" />
                <Skeleton
                  style={{ height: 20, width: "90%" }}
                  className="mb-2 mt-1"
                />
                <Skeleton
                  style={{ height: 18, width: "80%" }}
                  className="mb-2"
                />
                <Skeleton
                  style={{ height: 25, width: "95%" }}
                  className="mb-2"
                />
              </>
            )}
            {/* end skeleton */}

            {/* main content */}
            {!loading && (
              <h1 className="pt-4">
                <TextToSpeech
                  voiceURI={jaVoices[activeVoice]?.voiceURI}
                  lang={(sentence && "ja-JP") || "en-US"}
                >
                  {(sentence && sentence.content) ||
                    "There is no content to display"}
                </TextToSpeech>
              </h1>
            )}

            {!loading && isShownFurigana && (
              <p className="text subtitle">
                <TextToSpeech
                  voiceURI={jaVoices[activeVoice]?.voiceURI}
                  lang={(sentence && "ja-JP") || "en-US"}
                >
                  {(sentence && sentence.furigana) ||
                    "There is no furigana to display"}
                </TextToSpeech>
              </p>
            )}

            {!loading && isShownRomaji && (
              <p id="romaji" className="text small">
                {(sentence && sentence.romaji) ||
                  "There is no romaji to display"}
              </p>
            )}

            {!loading && isShownMeaning && (
              <p className="text normal">
                <TextToSpeech
                  lang="en-US"
                  voiceURI={subVoices[activeSubVoice.index]?.voiceURI}
                >
                  {(sentence &&
                    (activeSubVoice.lang === "en-US"
                      ? sentence.en_meaning
                      : sentence.vn_meaning)) ||
                    "There is no meaning to display"}
                </TextToSpeech>
              </p>
            )}
          </div>
          {/* end main content */}

          {/* refresh button */}
          <div className="refresh-button">
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <ArrowClockwise onClick={() => handleRefresh()} />
            )}
            <p className="text hint">
              {loading ? "Refreshing..." : "Refresh new sentence"}
            </p>
          </div>
        </Card>

        {/* options */}
        <Row>
          <Col className="text-start">
            <span>Display options</span>
          </Col>
          <Col className="text-end">
            <Button
              variant="info"
              style={{
                color: "white",
                fontSize: 10,
                padding: 0,
                paddingLeft: 5,
                paddingRight: 5,
              }}
              onClick={handleSaveOptions}
              disabled={!canSaveOptions}
            >
              Save options
            </Button>
          </Col>
        </Row>

        {/* option list */}
        <div className="buttons">
          <Form>
            <Form.Check // prettier-ignore
              type="switch"
              checked={isShownInformal}
              onChange={
                canSaveOptions
                  ? () => setShowingInformal(!isShownInformal)
                  : () => {
                      setShowingInformal(!isShownInformal);
                      setCanSaveOptions(true);
                    }
              }
              label="Show Informal Form"
              style={{ fontSize: 12 }}
              className="text-start"
            />
          </Form>

          <Form>
            <Form.Check // prettier-ignore
              type="switch"
              checked={isShownFurigana}
              label="Show Furigana"
              onChange={
                canSaveOptions
                  ? () => setShowingFurigana(!isShownFurigana)
                  : () => {
                      setShowingFurigana(!isShownFurigana);
                      setCanSaveOptions(true);
                    }
              }
              style={{ fontSize: 12 }}
              className="text-start"
            />
          </Form>

          <Form>
            <Form.Check // prettier-ignore
              type="switch"
              label="Show Romaji"
              checked={isShownRomaji}
              onChange={
                canSaveOptions
                  ? () => setShowingRomaji(!isShownRomaji)
                  : () => {
                      setShowingRomaji(!isShownRomaji);
                      setCanSaveOptions(true);
                    }
              }
              style={{ fontSize: 12 }}
              className="text-start"
            />
          </Form>

          <Form>
            <Form.Check // prettier-ignore
              type="switch"
              checked={isShownMeaning}
              label="Show Meaning"
              onChange={
                canSaveOptions
                  ? () => setShowingMeaning(!isShownMeaning)
                  : () => {
                      setShowingMeaning(!isShownMeaning);
                      setCanSaveOptions(true);
                    }
              }
              style={{ fontSize: 12 }}
              className="text-start"
            />
          </Form>
        </div>
        {/* end options */}

        {/* topics */}
        <Row>
          <Col className="text-start">
            <span>Related topics</span>
          </Col>
          <Col className="text-end">
            <Button
              variant="info"
              style={{
                color: "white",
                fontSize: 10,
                padding: 0,
                paddingLeft: 5,
                paddingRight: 5,
              }}
              onClick={handleSaveTopics}
              disabled={!canSaveTopics}
            >
              Save topics
            </Button>
          </Col>
        </Row>

        <div className="container">
          <div className="topics row">
            {topics.map((topic) => (
              <Form.Check
                type={"checkbox"}
                key={topic.id}
                label={topic.title}
                style={{ fontSize: 12 }}
                className="text-start col-sm-6 col-12"
                checked={activeTopics.includes(topic.id)}
                onChange={(e) => handleCheckTopic(e.target.checked, topic.id)}
              />
            ))}
          </div>
        </div>
        {/* end topics */}

        {/* voices */}
        <Row>
          <Col className="text-start">
            <span>Voices</span>
          </Col>
          <Col className="text-end">
            <Button
              variant="info"
              style={{
                color: "white",
                fontSize: 10,
                padding: 0,
                paddingLeft: 5,
                paddingRight: 5,
              }}
              onClick={handleSaveVoices}
              disabled={!canSaveVoicess}
            >
              Save voices
            </Button>
          </Col>
        </Row>

        <div className="voices">
          {/* main voice */}
          <p className="text small m-0 text-start mt-1">
            Main Voice (Japanese)
          </p>
          <Dropdown className="text-start">
            <Dropdown.Toggle
              variant="info"
              className="py-0 px-2"
              style={{ color: "white", fontSize: 12 }}
            >
              {jaVoices[activeVoice]?.name}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Header>Main Voice (Japanese)</Dropdown.Header>
              {jaVoices.map((voice, index) => (
                <Dropdown.Item
                  style={{ fontSize: 12 }}
                  key={index}
                  onClick={
                    canSaveVoicess
                      ? () => setActiveVoice(index)
                      : () => {
                          setActiveVoice(index);
                          setCanSaveVoicess(true);
                        }
                  }
                >
                  {voice.name}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <p className="text small m-0 text-start mt-1">
            Sub Voice (
            {activeSubVoice.lang === "en-US" ? "English" : "Vietnamese"})
          </p>
          {/* sub voice */}
          <Dropdown className="text-start">
            <Dropdown.Toggle
              variant="info"
              className="py-0 px-2"
              style={{ color: "white", fontSize: 12 }}
            >
              {subVoices[activeSubVoice.index]?.name}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {subVoices.map((voice, index) => (
                <Dropdown.Item
                  style={{ fontSize: 12 }}
                  key={index}
                  onClick={
                    canSaveVoicess
                      ? () => setActiveSubVoice({ index, lang: voice.lang })
                      : () => {
                          setActiveSubVoice({ index, lang: voice.lang });
                          setCanSaveVoicess(true);
                        }
                  }
                >
                  {voice.name}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        {/* end voices */}

        {/* gemini key */}
        <Row className="mt-2">
          <Col className="text-start">
            <span>Gemini API key</span>
          </Col>
          <Col className="text-end">
            <Button
              variant="info"
              style={{
                color: "white",
                fontSize: 10,
                padding: 0,
                paddingLeft: 5,
                paddingRight: 5,
              }}
              onClick={() => setShownModal(true)}
            >
              Add new
            </Button>
          </Col>
        </Row>

        <p className="text small">
          <i>
            Provide new Gemini API key for faster and more detailed content
            responded
          </i>
        </p>
        {/* end gemini key */}
      </div>

      <Modal show={isShownModal} onHide={() => setShownModal(false)}>
        <Modal.Body>
          <p className="text subtitle">Provide new Gemini API Key</p>

          <p className="text normal m-0 mb-1">Gemini API Key</p>
          <Form.Control
            type="password"
            value={geminiKey}
            onChange={(value) => setGeminiKey(value.target.value)}
            placeholder="Paste your key here..."
            style={{ fontSize: 12 }}
          />
          <Form.Text muted>
            <a
              className="text-info text small"
              href={GEMINI_LINK}
              target="_blank"
            >
              Click here to find your own Gemini API Key
            </a>
          </Form.Text>
        </Modal.Body>
        <Modal.Footer style={{ padding: 5 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShownModal(false)}
          >
            Close
          </Button>

          {checking ? (
            <Button
              size="sm"
              variant="info"
              style={{ color: "white" }}
              disabled
            >
              <Spinner
                as="span"
                animation="grow"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              Checking...
            </Button>
          ) : (
            <Button
              size="sm"
              variant="info"
              style={{ color: "white" }}
              onClick={handleSaveKey}
              disabled={
                !geminiKey ||
                !GenerativeContentService.checkAPIFormat(geminiKey)
              }
            >
              Save Key
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <ToastContainer />
    </div>
  );
}
