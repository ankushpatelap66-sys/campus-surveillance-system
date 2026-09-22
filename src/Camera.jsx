import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";


const CVRU_MODULE_STYLES = `
  .cvru-module-brand{
    width:100%;max-width:1280px;margin:0 auto 24px;box-sizing:border-box;
    display:flex;align-items:center;justify-content:space-between;gap:24px;
    padding:18px 22px;background:#fff;border:1px solid #dce6f3;border-radius:18px;
    box-shadow:0 8px 24px rgba(10,47,90,.06);
  }
  .cvru-module-brand-left{display:flex;align-items:center;gap:16px;min-width:0}
  .cvru-module-logo-box{width:74px;height:58px;display:flex;align-items:center;justify-content:center;flex:0 0 74px;overflow:hidden;border-radius:10px;background:#f7faff}
  .cvru-module-logo{width:100%;height:100%;object-fit:contain}
  .cvru-module-brand-name{font-size:20px;font-weight:900;letter-spacing:.2px;color:#123b6b;line-height:1.1}
  .cvru-module-brand-location{margin-top:5px;font-size:12px;font-weight:800;letter-spacing:1.5px;color:#66809e}
  .cvru-module-brand-right{display:flex;align-items:center;gap:9px;color:#58708d;font-size:14px;white-space:nowrap}
  .cvru-module-online-dot{width:10px;height:10px;border-radius:50%;background:#17b978;box-shadow:0 0 0 5px #e6f8f1}
  .cvru-module-brand-right strong{color:#173d68}
  @media(max-width:760px){.cvru-module-brand{align-items:flex-start;padding:15px;}.cvru-module-brand-right{display:none}.cvru-module-logo-box{width:62px;height:52px;flex-basis:62px}.cvru-module-brand-name{font-size:16px}.cvru-module-brand-location{font-size:10px}}
`;

function CVRUModuleBrand(){
  return (
    <section className="cvru-module-brand">
      <div className="cvru-module-brand-left">
        <div className="cvru-module-logo-box">
          <img className="cvru-module-logo" src="/cvru-logo.png" alt="CVRU logo" onError={(e)=>{e.currentTarget.style.display="none";}} />
        </div>
        <div>
          <div className="cvru-module-brand-name">DR. C. V. RAMAN UNIVERSITY</div>
          <div className="cvru-module-brand-location">VAISHALI, BIHAR</div>
        </div>
      </div>
      <div className="cvru-module-brand-right">
        <span className="cvru-module-online-dot"/>
        <span>Security Monitoring</span>
        <strong>System Online</strong>
      </div>
    </section>
  );
}

const API_BASE = import.meta.env.VITE_API_URL;

function Camera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);

  const autoScanRef = useRef(null);
  const scanningRef = useRef(false);

  // Plate observations across scans
  const observationsRef = useRef(new Map());

  // Backend cooldown
  const processedPlatesRef = useRef(new Map());

  // Alert/announcement audio state.
  // AudioContext is unlocked from the Start Camera button so that
  // automatic detection can play sound later without another click.
  const audioContextRef = useRef(null);
  const sirenTimerRef = useRef(null);
  const speechVoicesRef = useRef([]);
  const speakingRef = useRef(false);

  const [cameraRunning, setCameraRunning] =
    useState(false);

  const [ocrReady, setOcrReady] =
    useState(false);

  const [scanning, setScanning] =
    useState(false);

  const [cameraName, setCameraName] =
    useState("Default Webcam");

  const [detectedPlate, setDetectedPlate] =
    useState("");

  const [ocrText, setOcrText] =
    useState("");

  const [statusMessage, setStatusMessage] =
    useState("Camera is ready.");

  const [recentDetections, setRecentDetections] =
    useState([]);

  /* =====================================================
     AUDIO HELPERS

     Authorized vehicle  -> smooth university welcome voice
     Unauthorized vehicle -> loud police-style siren for 5 seconds
  ===================================================== */

  const loadSpeechVoices = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return [];
    }

    const voices = window.speechSynthesis.getVoices();
    speechVoicesRef.current = voices;
    return voices;
  };

  const chooseWelcomeVoice = () => {
    const voices =
      speechVoicesRef.current.length > 0
        ? speechVoicesRef.current
        : loadSpeechVoices();

    if (!voices.length) {
      return null;
    }

    // Prefer a clear English voice. Exact voice names vary by Windows/browser.
    const preferredNames = [
      "Microsoft Zira Desktop",
      "Microsoft Aria Online (Natural) - English (United States)",
      "Google UK English Female",
      "Google US English",
      "Samantha",
    ];

    for (const name of preferredNames) {
      const match = voices.find((voice) =>
        voice.name.toLowerCase().includes(name.toLowerCase())
      );

      if (match) {
        return match;
      }
    }

    return (
      voices.find((voice) =>
        /^en(-|_)/i.test(voice.lang || "")
      ) || voices[0]
    );
  };

  const unlockAudio = () => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;

        if (AudioContextClass) {
          audioContextRef.current =
            new AudioContextClass();
        }
      }

      const context = audioContextRef.current;

      if (context && context.state === "suspended") {
        context.resume().catch(() => {});
      }
    } catch (error) {
      console.warn("AUDIO INIT WARNING:", error);
    }
  };

  const stopUnauthorizedSiren = () => {
    if (sirenTimerRef.current) {
      clearTimeout(sirenTimerRef.current);
      sirenTimerRef.current = null;
    }
  };

  const playUnauthorizedSiren = () => {
    stopUnauthorizedSiren();

    try {
      const context =
        audioContextRef.current ||
        new (window.AudioContext || window.webkitAudioContext)();

      audioContextRef.current = context;

      if (context.state === "suspended") {
        context.resume().catch(() => {});
      }

      const master = context.createGain();
      master.gain.setValueAtTime(0.0001, context.currentTime);
      master.gain.exponentialRampToValueAtTime(0.42, context.currentTime + 0.04);
      master.connect(context.destination);

      const oscillatorA = context.createOscillator();
      const oscillatorB = context.createOscillator();
      const gainA = context.createGain();
      const gainB = context.createGain();

      oscillatorA.type = "sawtooth";
      oscillatorB.type = "square";

      gainA.gain.value = 0.55;
      gainB.gain.value = 0.16;

      oscillatorA.connect(gainA);
      oscillatorB.connect(gainB);
      gainA.connect(master);
      gainB.connect(master);

      const startTime = context.currentTime;
      const duration = 5;
      const cycle = 0.85;
      const cycles = Math.ceil(duration / cycle);

      // Fast rising/falling police-style sweep.
      for (let i = 0; i < cycles; i += 1) {
        const t = startTime + i * cycle;
        const high = i % 2 === 0;

        oscillatorA.frequency.setValueAtTime(650, t);
        oscillatorA.frequency.linearRampToValueAtTime(1050, t + 0.34);
        oscillatorA.frequency.linearRampToValueAtTime(650, t + 0.72);

        oscillatorB.frequency.setValueAtTime(325, t);
        oscillatorB.frequency.linearRampToValueAtTime(525, t + 0.34);
        oscillatorB.frequency.linearRampToValueAtTime(325, t + 0.72);

        if (high) {
          oscillatorA.detune.setValueAtTime(0, t);
        } else {
          oscillatorA.detune.setValueAtTime(-55, t);
        }
      }

      oscillatorA.start(startTime);
      oscillatorB.start(startTime);

      const stopAt = startTime + duration;
      master.gain.setValueAtTime(0.42, stopAt - 0.18);
      master.gain.exponentialRampToValueAtTime(0.0001, stopAt);

      oscillatorA.stop(stopAt + 0.03);
      oscillatorB.stop(stopAt + 0.03);

      sirenTimerRef.current = setTimeout(() => {
        sirenTimerRef.current = null;
      }, duration * 1000);
    } catch (error) {
      console.error("SIREN AUDIO ERROR:", error);
    }
  };

  const speakAuthorizedWelcome = () => {
    if (
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(
        "Welcome to Dr. C. V. Raman University, Vaishali, Bihar."
      );

      utterance.lang = "en-IN";
      utterance.rate = 0.88;
      utterance.pitch = 1.02;
      utterance.volume = 1;

      const voice = chooseWelcomeVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        speakingRef.current = true;
      };

      utterance.onend = () => {
        speakingRef.current = false;
      };

      utterance.onerror = () => {
        speakingRef.current = false;
      };

      speakingRef.current = true;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      speakingRef.current = false;
      console.error("WELCOME VOICE ERROR:", error);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return undefined;
    }

    // Some browsers populate voices asynchronously.
    loadSpeechVoices();

    const handleVoicesChanged = () => {
      loadSpeechVoices();
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      handleVoicesChanged
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged
      );
    };
  }, []);

  /* =====================================================
     START CAMERA
  ===================================================== */

  const startCamera = async () => {
    try {
      // The Start Camera click unlocks browser audio for automatic alerts.
      unlockAudio();
      loadSpeechVoices();

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setStatusMessage(
          "Camera is not supported in this browser."
        );
        return;
      }

      if (cameraRunning) {
        return;
      }

      setStatusMessage(
        "Starting camera..."
      );

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
            facingMode: {
              ideal: "environment",
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      const track =
        stream.getVideoTracks()[0];

      if (track) {
        setCameraName(
          track.label ||
            "Default Webcam"
        );

        console.log(
          "CAMERA DEVICE:",
          track.label
        );

        console.log(
          "CAMERA SETTINGS:",
          track.getSettings()
        );
      }

      setCameraRunning(true);

      setStatusMessage(
        "Camera started. Automatic scanning is active."
      );
    } catch (error) {
      console.error(
        "CAMERA ERROR:",
        error
      );

      setCameraRunning(false);

      if (
        error?.name ===
        "NotAllowedError"
      ) {
        setStatusMessage(
          "Camera permission denied."
        );
      } else if (
        error?.name ===
        "NotFoundError"
      ) {
        setStatusMessage(
          "No camera found."
        );
      } else if (
        error?.name ===
        "NotReadableError"
      ) {
        setStatusMessage(
          "Camera is busy. Close other camera applications."
        );
      } else {
        setStatusMessage(
          error?.message ||
            "Camera could not be started."
        );
      }
    }
  };

  /* =====================================================
     CONNECT CAMERA
  ===================================================== */

  useEffect(() => {
    if (
      !cameraRunning ||
      !videoRef.current ||
      !streamRef.current
    ) {
      return;
    }

    const video =
      videoRef.current;

    video.srcObject =
      streamRef.current;

    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;

    const playVideo =
      async () => {
        try {
          await video.play();

          console.log(
            "VIDEO SIZE:",
            video.videoWidth,
            "x",
            video.videoHeight
          );
        } catch (error) {
          console.error(
            "VIDEO PLAY ERROR:",
            error
          );
        }
      };

    playVideo();

    return () => {
      video.pause();
    };
  }, [cameraRunning]);

  /* =====================================================
     STOP CAMERA
  ===================================================== */

  const stopCamera = () => {
    if (autoScanRef.current) {
      clearInterval(
        autoScanRef.current
      );

      autoScanRef.current =
        null;
    }

    scanningRef.current = false;

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject =
        null;
    }

    observationsRef.current.clear();

    processedPlatesRef.current.clear();

    setCameraRunning(false);
    setScanning(false);

    setDetectedPlate("");
    setOcrText("");

    setStatusMessage(
      "Camera stopped."
    );
  };

  /* =====================================================
     LOAD OCR
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    const loadOCR =
      async () => {
        try {
          console.log(
            "OCR: loading worker..."
          );

          setStatusMessage(
            "Loading OCR engine..."
          );

          const worker =
            await createWorker(
              "eng"
            );

          if (!mounted) {
            await worker.terminate();
            return;
          }

          workerRef.current =
            worker;

          await worker.setParameters(
            {
              tessedit_char_whitelist:
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",

              preserve_interword_spaces:
                "0",
            }
          );

          setOcrReady(true);

          setStatusMessage(
            "OCR ready. Start camera."
          );

          console.log(
            "OCR READY"
          );
        } catch (error) {
          console.error(
            "OCR LOAD ERROR:",
            error
          );

          if (mounted) {
            setStatusMessage(
              `OCR initialization failed: ${
                error?.message ||
                "Unknown error"
              }`
            );
          }
        }
      };

    loadOCR();

    return () => {
      mounted = false;

      if (workerRef.current) {
        workerRef.current
          .terminate()
          .catch(() => {});

        workerRef.current =
          null;
      }
    };
  }, []);

  /* =====================================================
     NORMALIZE TEXT
  ===================================================== */

  const normalizeText = (
    text
  ) => {
    return String(
      text || ""
    )
      .toUpperCase()
      .replace(
        /[^A-Z0-9]/g,
        ""
      );
  };

  /* =====================================================
     VALIDATE PLATE FORMAT
  ===================================================== */

  const isVehicleNumber = (
    plate
  ) => {
    if (!plate) {
      return false;
    }

    /*
      Standard format:

      KA01MN9787
      UP27AD1432

      State  : 2 letters
      RTO    : 2 digits
      Series : 1-3 letters
      Number : 4 digits
    */

    const pattern =
      /^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/;

    return pattern.test(
      plate
    );
  };

  /* =====================================================
     REPAIR OCR CANDIDATE
  ===================================================== */

  const repairCandidate = (
    value
  ) => {
    const original =
      normalizeText(value);

    if (!original) {
      return "";
    }

    if (
      isVehicleNumber(
        original
      )
    ) {
      return original;
    }

    const variants =
      new Set();

    variants.add(
      original
    );

    variants.add(
      original.replace(
        /I/g,
        "1"
      )
    );

    variants.add(
      original.replace(
        /L/g,
        "1"
      )
    );

    variants.add(
      original.replace(
        /O/g,
        "0"
      )
    );

    variants.add(
      original.replace(
        /Q/g,
        "0"
      )
    );

    variants.add(
      original.replace(
        /Z/g,
        "2"
      )
    );

    variants.add(
      original.replace(
        /S/g,
        "5"
      )
    );

    variants.add(
      original.replace(
        /B/g,
        "8"
      )
    );

    for (
      const variant of variants
    ) {
      if (
        isVehicleNumber(
          variant
        )
      ) {
        return variant;
      }
    }

    /*
      Structured OCR repair.

      Example:

      UP27ADI432

      OCR has read I where
      the first number should be 1.

      Try replacing ambiguous
      characters in the series.
    */

    const match =
      original.match(
        /^([A-Z]{2})([0-9]{2})([A-Z]{1,3})([0-9]{4})$/
      );

    if (match) {
      const stateCode =
        match[1];

      const district =
        match[2];

      const series =
        match[3];

      const number =
        match[4];

      const replacements = {
        I: "1",
        L: "1",
        O: "0",
        Q: "0",
        Z: "2",
        S: "5",
        B: "8",
      };

      const chars =
        series.split("");

      for (
        let i = 0;
        i < chars.length;
        i++
      ) {
        const replacement =
          replacements[
            chars[i]
          ];

        if (replacement) {
          const newSeries =
            [...chars];

          newSeries[i] =
            replacement;

          const candidate =
            `${stateCode}${district}${newSeries.join("")}${number}`;

          if (
            isVehicleNumber(
              candidate
            )
          ) {
            return candidate;
          }
        }
      }
    }

    return "";
  };

  /* =====================================================
     EXTRACT PLATE CANDIDATES
  ===================================================== */

  const extractPlateCandidates =
    (text) => {
      const raw =
        String(text || "")
          .toUpperCase();

      const candidates =
        new Set();

      /*
        A. Direct text
      */

      const compact =
        normalizeText(raw);

      if (
        isVehicleNumber(
          compact
        )
      ) {
        candidates.add(
          compact
        );
      }

      /*
        B. Regex search inside OCR
      */

      const directMatches =
        compact.match(
          /[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}/g
        );

      if (directMatches) {
        directMatches.forEach(
          (match) => {
            if (
              isVehicleNumber(
                match
              )
            ) {
              candidates.add(
                match
              );
            }
          }
        );
      }

      /*
        C. Words
      */

      const words =
        raw
          .split(
            /[\s\n\r\t]+/
          )
          .map((word) =>
            normalizeText(word)
          )
          .filter(Boolean);

      words.forEach(
        (word) => {
          if (
            isVehicleNumber(
              word
            )
          ) {
            candidates.add(
              word
            );
          }

          const repaired =
            repairCandidate(
              word
            );

          if (
            repaired
          ) {
            candidates.add(
              repaired
            );
          }
        }
      );

      /*
        D. OCR with spaces

        KA 01 MN 9787
      */

      const spacedPattern =
        /([A-Z]{2})\s*([0-9]{2})\s*([A-Z]{1,3})\s*([0-9]{4})/g;

      let match;

      while (
        (match =
          spacedPattern.exec(
            raw
          )) !== null
      ) {
        const candidate =
          `${match[1]}${match[2]}${match[3]}${match[4]}`;

        if (
          isVehicleNumber(
            candidate
          )
        ) {
          candidates.add(
            candidate
          );
        }

        const repaired =
          repairCandidate(
            candidate
          );

        if (
          repaired
        ) {
          candidates.add(
            repaired
          );
        }
      }

      return [
        ...candidates,
      ];
    };

  /* =====================================================
     BACKEND PROCESS
  ===================================================== */

  const processDetectedPlate =
    async (plate) => {
      const normalizedPlate =
        normalizeText(plate);

      if (
        !isVehicleNumber(
          normalizedPlate
        )
      ) {
        return;
      }

      /*
        Always show the confirmed result.
      */

      setDetectedPlate(
        normalizedPlate
      );

      const now =
        Date.now();

      const lastProcessed =
        processedPlatesRef.current.get(
          normalizedPlate
        );

      /*
        30 second duplicate protection.
      */

      if (
        lastProcessed &&
        now - lastProcessed <
          30000
      ) {
        setStatusMessage(
          `Vehicle already processed: ${normalizedPlate}`
        );

        return;
      }

      try {
        setStatusMessage(
          `Processing ${normalizedPlate}...`
        );

        console.log(
          "================================="
        );

        console.log(
          "SENDING VEHICLE TO BACKEND:",
          normalizedPlate
        );

        const response =
          await fetch(
            `${API_BASE}/automation/vehicle-detected`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                vehicleNumber:
                  normalizedPlate,

                camera:
                  "Main Gate",
              }),
            }
          );

        const data =
          await response.json();

        console.log(
          "BACKEND RESPONSE:",
          data
        );

        console.log(
          "================================="
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Backend request failed."
          );
        }

        /*
          Mark only after successful
          backend response.
        */

        processedPlatesRef.current.set(
          normalizedPlate,
          Date.now()
        );

        if (
          data.authorized ===
          false
        ) {
          setStatusMessage(
            `Unauthorized Vehicle: ${normalizedPlate}`
          );

          // Loud police-style warning for exactly 5 seconds.
          playUnauthorizedSiren();
        } else if (
          data.action ===
          "ENTRY"
        ) {
          setStatusMessage(
            data.parkingSlot
              ? `ENTRY recorded • Parking ${data.parkingSlot}`
              : "ENTRY recorded"
          );

          // Smooth welcome announcement for an authorized vehicle entering campus.
          speakAuthorizedWelcome();
        } else if (
          data.action ===
          "EXIT"
        ) {
          setStatusMessage(
            data.message ||
              "EXIT recorded and parking updated."
          );
        } else {
          setStatusMessage(
            data.message ||
              "Vehicle processed."
          );
        }

        setRecentDetections(
          (previous) => [
            {
              plate:
                normalizedPlate,

              action:
                data.authorized ===
                false
                  ? "ALERT"
                  : data.action ||
                    "DETECTED",

              parkingSlot:
                data.parkingSlot ||
                null,

              time:
                new Date().toLocaleTimeString(),
            },

            ...previous,
          ].slice(0, 10)
        );
      } catch (error) {
        console.error(
          "BACKEND ERROR:",
          error
        );

        setStatusMessage(
          error?.message ||
            "Backend processing failed."
        );

        /*
          Allow next scan to retry.
        */

        processedPlatesRef.current.delete(
          normalizedPlate
        );
      }
    };

  /* =====================================================
     IMAGE PREPROCESSING
  ===================================================== */

  const createOCRCanvas = (
    sourceCanvas,
    scale = 2.5,
    threshold = null
  ) => {
    const output =
      document.createElement(
        "canvas"
      );

    output.width =
      Math.max(
        1,
        Math.floor(
          sourceCanvas.width *
            scale
        )
      );

    output.height =
      Math.max(
        1,
        Math.floor(
          sourceCanvas.height *
            scale
        )
      );

    const ctx =
      output.getContext(
        "2d",
        {
          willReadFrequently:
            true,
        }
      );

    ctx.drawImage(
      sourceCanvas,
      0,
      0,
      output.width,
      output.height
    );

    const imageData =
      ctx.getImageData(
        0,
        0,
        output.width,
        output.height
      );

    const pixels =
      imageData.data;

    for (
      let i = 0;
      i < pixels.length;
      i += 4
    ) {
      const r =
        pixels[i];

      const g =
        pixels[i + 1];

      const b =
        pixels[i + 2];

      let gray =
        0.299 * r +
        0.587 * g +
        0.114 * b;

      /*
        Increase contrast.
      */

      gray =
        (gray - 128) *
          1.35 +
        128;

      gray =
        Math.max(
          0,
          Math.min(
            255,
            gray
          )
        );

      /*
        Optional threshold.
      */

      if (
        threshold !== null
      ) {
        gray =
          gray >= threshold
            ? 255
            : 0;
      }

      pixels[i] =
        gray;

      pixels[i + 1] =
        gray;

      pixels[i + 2] =
        gray;
    }

    ctx.putImageData(
      imageData,
      0,
      0
    );

    return output;
  };

  /* =====================================================
     CROP REGION
  ===================================================== */

  const cropRegion = (
    sourceCanvas,
    x,
    y,
    width,
    height
  ) => {
    const canvas =
      document.createElement(
        "canvas"
      );

    const sx =
      Math.floor(
        sourceCanvas.width *
          x
      );

    const sy =
      Math.floor(
        sourceCanvas.height *
          y
      );

    const sw =
      Math.floor(
        sourceCanvas.width *
          width
      );

    const sh =
      Math.floor(
        sourceCanvas.height *
          height
      );

    canvas.width =
      Math.max(
        1,
        sw
      );

    canvas.height =
      Math.max(
        1,
        sh
      );

    const ctx =
      canvas.getContext(
        "2d"
      );

    ctx.drawImage(
      sourceCanvas,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      sw,
      sh
    );

    return canvas;
  };

  /* =====================================================
     GET SCAN REGIONS
  ===================================================== */

  const getScanRegions =
    (fullCanvas) => {
      return [
        {
          name:
            "FULL FRAME",
          canvas:
            fullCanvas,
        },

        {
          name:
            "CENTER",
          canvas:
            cropRegion(
              fullCanvas,
              0.08,
              0.08,
              0.84,
              0.84
            ),
        },

        {
          name:
            "LEFT",
          canvas:
            cropRegion(
              fullCanvas,
              0,
              0.10,
              0.70,
              0.75
            ),
        },

        {
          name:
            "RIGHT",
          canvas:
            cropRegion(
              fullCanvas,
              0.30,
              0.10,
              0.70,
              0.75
            ),
        },
      ];
    };

  /* =====================================================
     CHOOSE BEST CANDIDATE
  ===================================================== */

  const chooseBestCandidate =
    (candidateList) => {
      const candidateMap =
        new Map();

      candidateList.forEach(
        (item) => {
          const existing =
            candidateMap.get(
              item.plate
            );

          if (existing) {
            /*
              Same plate was recognized
              by another OCR pass.
            */

            existing.count += 1;

            existing.confidence =
              Math.max(
                existing.confidence,
                item.confidence ||
                  0
              );
          } else {
            candidateMap.set(
              item.plate,
              {
                plate:
                  item.plate,

                count: 1,

                confidence:
                  item.confidence ||
                  0,
              }
            );
          }
        }
      );

      const candidates =
        [
          ...candidateMap.values(),
        ];

      /*
        Frequency has priority.

        Example:

        KA01MN9787 -> count 3
        AO1MN9787  -> count 1

        KA01MN9787 wins.
      */

      candidates.sort(
        (a, b) => {
          if (
            b.count !==
            a.count
          ) {
            return (
              b.count -
              a.count
            );
          }

          return (
            (b.confidence ||
              0) -
            (a.confidence ||
              0)
          );
        }
      );

      return candidates;
    };

  /* =====================================================
     CONFIRM CANDIDATE
  ===================================================== */

  const observeCandidate =
    (
      plate,
      confidence,
      sameScanCount
    ) => {
      const normalizedPlate =
        normalizeText(
          plate
        );

      if (
        !isVehicleNumber(
          normalizedPlate
        )
      ) {
        return;
      }

      /*
        Show candidate immediately.
      */

      setDetectedPlate(
        normalizedPlate
      );

      const now =
        Date.now();

      const previous =
        observationsRef.current.get(
          normalizedPlate
        ) || {
          count: 0,
          lastSeen: 0,
          bestConfidence: 0,
        };

      if (
        now -
          previous.lastSeen >
        10000
      ) {
        previous.count =
          0;
      }

      /*
        One scan with the same plate
        appearing in multiple OCR
        variants is strong evidence.
      */

      previous.count += 1;

      previous.lastSeen =
        now;

      previous.bestConfidence =
        Math.max(
          previous.bestConfidence,
          confidence || 0
        );

      observationsRef.current.set(
        normalizedPlate,
        previous
      );

      console.log(
        "PLATE CANDIDATE:",
        normalizedPlate
      );

      console.log(
        "SAME SCAN COUNT:",
        sameScanCount
      );

      console.log(
        "CROSS SCAN COUNT:",
        previous.count
      );

      /*
        FAST CONFIRMATION

        Same plate recognized by
        2+ OCR passes in current frame
        OR
        OCR confidence is strong
        OR
        same plate appeared in 2 scans.
      */

      const confirmed =
        sameScanCount >= 2 ||
        previous.count >= 2 ||
        previous.bestConfidence >=
          75;

      if (confirmed) {
        setStatusMessage(
          `Vehicle confirmed: ${normalizedPlate}`
        );

        observationsRef.current.delete(
          normalizedPlate
        );

        processDetectedPlate(
          normalizedPlate
        );
      } else {
        setStatusMessage(
          `Plate candidate found: ${normalizedPlate} — confirming...`
        );
      }
    };

  /* =====================================================
     OCR SCAN
  ===================================================== */

  const scanFrame =
    async () => {
      if (
        !cameraRunning ||
        !ocrReady ||
        !workerRef.current ||
        !videoRef.current ||
        !canvasRef.current ||
        scanningRef.current
      ) {
        return;
      }

      const video =
        videoRef.current;

      if (
        video.videoWidth === 0 ||
        video.videoHeight === 0 ||
        video.readyState < 2
      ) {
        console.log(
          "SCAN SKIPPED: VIDEO NOT READY"
        );

        return;
      }

      scanningRef.current =
        true;

      setScanning(true);

      setStatusMessage(
        "Searching the full camera frame..."
      );

      try {
        const fullCanvas =
          canvasRef.current;

        const fullCtx =
          fullCanvas.getContext(
            "2d",
            {
              willReadFrequently:
                true,
            }
          );

        fullCanvas.width =
          video.videoWidth;

        fullCanvas.height =
          video.videoHeight;

        /*
          Capture current video frame.
        */

        fullCtx.drawImage(
          video,
          0,
          0,
          fullCanvas.width,
          fullCanvas.height
        );

        const candidateList =
          [];

        let combinedOCR =
          "";

        /* =================================================
           STAGE 1
           FULL FRAME
           ================================================= */

        const fullFrameVariants =
          [
            {
              name:
                "FULL FRAME / NORMAL",

              canvas:
                createOCRCanvas(
                  fullCanvas,
                  2.2,
                  null
                ),
            },

            {
              name:
                "FULL FRAME / THRESHOLD",

              canvas:
                createOCRCanvas(
                  fullCanvas,
                  2.2,
                  160
                ),
            },
          ];

        for (
          const variant of
            fullFrameVariants
        ) {
          await workerRef.current.setParameters(
            {
              tessedit_char_whitelist:
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",

              tessedit_pageseg_mode:
                "11",
            }
          );

          console.log(
            "OCR:",
            variant.name
          );

          const result =
            await workerRef.current.recognize(
              variant.canvas
            );

          const text =
            result?.data
              ?.text || "";

          const confidence =
            Number(
              result?.data
                ?.confidence ||
                0
            );

          console.log(
            variant.name,
            text,
            "CONF:",
            confidence
          );

          combinedOCR +=
            `\n[${variant.name}]\n${text}`;

          const candidates =
            extractPlateCandidates(
              text
            );

          candidates.forEach(
            (plate) => {
              candidateList.push(
                {
                  plate,
                  confidence,
                }
              );
            }
          );
        }

        /*
          See whether full frame
          already produced a reliable
          repeated plate.
        */

        let rankedCandidates =
          chooseBestCandidate(
            candidateList
          );

        /*
          If full frame already finds
          a strong repeated candidate,
          don't waste time on more OCR.
        */

        const fullFrameBest =
          rankedCandidates[0];

        const fullFrameConfirmed =
          fullFrameBest &&
          (
            fullFrameBest.count >=
              2 ||
            fullFrameBest.confidence >=
              75
          );

        /* =================================================
           STAGE 2
           FALLBACK REGIONS
           ================================================= */

        if (
          !fullFrameConfirmed
        ) {
          const regions =
            getScanRegions(
              fullCanvas
            );

          /*
            Skip FULL FRAME because
            it was already scanned.
          */

          const fallbackRegions =
            regions.filter(
              (region) =>
                region.name !==
                "FULL FRAME"
            );

          for (
            const region of
              fallbackRegions
          ) {
            /*
              First try NORMAL only.
              This makes detection faster.
            */

            const normalCanvas =
              createOCRCanvas(
                region.canvas,
                2.5,
                null
              );

            await workerRef.current.setParameters(
              {
                tessedit_char_whitelist:
                  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",

                tessedit_pageseg_mode:
                  "11",
              }
            );

            console.log(
              "OCR REGION:",
              region.name
            );

            const result =
              await workerRef.current.recognize(
                normalCanvas
              );

            const text =
              result?.data
                ?.text || "";

            const confidence =
              Number(
                result?.data
                  ?.confidence ||
                  0
              );

            console.log(
              `${region.name} / NORMAL:`,
              text,
              "CONF:",
              confidence
            );

            combinedOCR +=
              `\n[${region.name} / NORMAL]\n${text}`;

            const candidates =
              extractPlateCandidates(
                text
              );

            candidates.forEach(
              (plate) => {
                candidateList.push(
                  {
                    plate,
                    confidence,
                  }
                );
              }
            );

            /*
              If this region gave a valid
              candidate, also try threshold
              once.
            */

            if (
              candidates.length >
              0
            ) {
              const thresholdCanvas =
                createOCRCanvas(
                  region.canvas,
                  2.5,
                  160
                );

              const thresholdResult =
                await workerRef.current.recognize(
                  thresholdCanvas
                );

              const thresholdText =
                thresholdResult?.data
                  ?.text || "";

              const thresholdConfidence =
                Number(
                  thresholdResult?.data
                    ?.confidence ||
                    0
                );

              console.log(
                `${region.name} / THRESHOLD:`,
                thresholdText,
                "CONF:",
                thresholdConfidence
              );

              combinedOCR +=
                `\n[${region.name} / THRESHOLD]\n${thresholdText}`;

              const thresholdCandidates =
                extractPlateCandidates(
                  thresholdText
                );

              thresholdCandidates.forEach(
                (plate) => {
                  candidateList.push(
                    {
                      plate,
                      confidence:
                        thresholdConfidence,
                    }
                  );
                }
              );
            }

            /*
              Re-rank continuously.
            */

            rankedCandidates =
              chooseBestCandidate(
                candidateList
              );

            const best =
              rankedCandidates[0];

            /*
              Once the same plate has
              appeared twice, stop OCR.
            */

            if (
              best &&
              best.count >= 2
            ) {
              break;
            }
          }
        }

        rankedCandidates =
          chooseBestCandidate(
            candidateList
          );

        /*
          Show OCR debug output.
        */

        setOcrText(
          combinedOCR.trim() ||
            "OCR returned no text."
        );

        if (
          rankedCandidates.length ===
          0
        ) {
          setStatusMessage(
            "Scanning complete frame... No valid vehicle number found yet."
          );

          return;
        }

        const bestCandidate =
          rankedCandidates[0];

        console.log(
          "================================="
        );

        console.log(
          "RANKED OCR CANDIDATES:",
          rankedCandidates
        );

        console.log(
          "BEST PLATE:",
          bestCandidate
        );

        console.log(
          "================================="
        );

        /*
          Immediately show the best
          candidate.

          Backend processing waits
          for confirmation.
        */

        observeCandidate(
          bestCandidate.plate,
          bestCandidate.confidence,
          bestCandidate.count
        );
      } catch (error) {
        console.error(
          "OCR SCAN ERROR:",
          error
        );

        setOcrText(
          `OCR ERROR: ${
            error?.message ||
            "Unknown OCR error"
          }`
        );

        setStatusMessage(
          "OCR scanning error. Retrying..."
        );
      } finally {
        scanningRef.current =
          false;

        setScanning(false);
      }
    };

  /* =====================================================
     AUTOMATIC SCANNING
  ===================================================== */

  useEffect(() => {
    if (
      !cameraRunning ||
      !ocrReady
    ) {
      return;
    }

    console.log(
      "AUTOMATIC OCR SCANNING STARTED"
    );

    /*
      First scan quickly.
    */

    const firstScan =
      setTimeout(() => {
        scanFrame();
      }, 1500);

    /*
      Repeat every 4 seconds.
    */

    autoScanRef.current =
      setInterval(() => {
        scanFrame();
      }, 4000);

    return () => {
      clearTimeout(
        firstScan
      );

      if (
        autoScanRef.current
      ) {
        clearInterval(
          autoScanRef.current
        );

        autoScanRef.current =
          null;
      }
    };
  }, [
    cameraRunning,
    ocrReady,
  ]);

  /* =====================================================
     MANUAL SCAN
  ===================================================== */

  const manualScan = () => {
    if (!cameraRunning) {
      setStatusMessage(
        "Start Camera first."
      );

      return;
    }

    if (!ocrReady) {
      setStatusMessage(
        "OCR is still loading."
      );

      return;
    }

    scanFrame();
  };

  /* =====================================================
     CLEANUP
  ===================================================== */

  useEffect(() => {
    return () => {
      if (
        autoScanRef.current
      ) {
        clearInterval(
          autoScanRef.current
        );
      }

      if (
        streamRef.current
      ) {
        streamRef.current
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );
      }

      if (
        workerRef.current
      ) {
        workerRef.current
          .terminate()
          .catch(() => {});
      }

      stopUnauthorizedSiren();

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div
      className="camera-page"
      style={{
        width: "100%",
        minHeight:
          "calc(100vh - 72px)",
        padding:
          "40px 5%",
        background:
          "#f5f7fb",
      }}
    >
      <style>{CVRU_MODULE_STYLES}</style>
      {/* PROFESSIONAL HERO */}
      <section
        className="camera-page-hero"
        style={{
          maxWidth: "1200px",
          margin: "0 auto 30px",
          minHeight: "190px",
          borderRadius: "18px",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          backgroundImage: "linear-gradient(90deg, rgba(4,35,69,.94) 0%, rgba(8,55,96,.78) 48%, rgba(8,55,96,.25) 100%), url('/cvru-campus.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: "0 10px 28px rgba(8,43,82,.16)",
        }}
      >
        <div style={{ padding: "30px 34px", color: "#fff", position: "relative", zIndex: 1, maxWidth: "850px" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1.6px", color: "#b9dcff", marginBottom: "8px" }}>
            CAMPUS SURVEILLANCE SYSTEM
          </div>
          <h1 style={{ margin: 0, fontSize: "34px", lineHeight: 1.1, fontWeight: 900 }}>
            Camera Monitoring <span style={{ color: "#48a5ff" }}>&amp; Automatic ANPR</span>
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: "14px", lineHeight: 1.55, color: "#e5f1ff" }}>
            Real-time Main Gate surveillance with automatic number-plate recognition and OCR-based vehicle automation.
          </p>
        </div>
      </section>

      {/* STATS */}

      <div
        className="camera-stats"
        style={{
          maxWidth:
            "1200px",
          margin:
            "0 auto 30px",
          display:
            "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap:
            "20px",
        }}
      >
        <div className="camera-stat-card">
          <div className="camera-stat-icon" aria-hidden="true">◉</div>

          <div>
            <h2>
              {cameraRunning
                ? "1"
                : "0"}
            </h2>

            <p>
              Online Cameras
            </p>
          </div>
        </div>

        <div className="camera-stat-card">
          <div className="camera-stat-icon" aria-hidden="true">▣</div>

          <div>
            <h2>
              {
                recentDetections.length
              }
            </h2>

            <p>
              Detected Vehicles
            </p>
          </div>
        </div>

        <div className="camera-stat-card">
          <div className="camera-stat-icon" aria-hidden="true">◎</div>

          <div>
            <h2>
              {ocrReady
                ? "ON"
                : "OFF"}
            </h2>

            <p>
              OCR Status
            </p>
          </div>
        </div>
      </div>

      {/* CAMERA GRID */}

      <div
        className="camera-grid"
        style={{
          maxWidth:
            "1200px",
          margin:
            "0 auto",
          display:
            "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap:
            "25px",
        }}
      >
        {/* MAIN GATE */}

        <div className="camera-card">
          <div
            className="camera-preview camera-live-preview"
            style={{
              height:
                "300px",
              position:
                "relative",
              overflow:
                "hidden",
              background:
                "#111827",
            }}
          >
            {cameraRunning ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="camera-video"
                  style={{
                    width:
                      "100%",
                    height:
                      "100%",
                    objectFit:
                      "cover",
                    display:
                      "block",
                  }}
                />

                <div
                  style={{
                    position:
                      "absolute",
                    top:
                      "14px",
                    left:
                      "14px",
                    zIndex:
                      10,
                    background:
                      "#dc2626",
                    color:
                      "#ffffff",
                    padding:
                      "6px 11px",
                    borderRadius:
                      "6px",
                    fontSize:
                      "12px",
                    fontWeight:
                      "700",
                  }}
                >
                  ● LIVE
                </div>

                <div
                  style={{
                    position:
                      "absolute",
                    bottom:
                      "12px",
                    left:
                      "12px",
                    right:
                      "12px",
                    zIndex:
                      10,
                    background:
                      "rgba(0,0,0,.65)",
                    color:
                      "#ffffff",
                    padding:
                      "8px 12px",
                    borderRadius:
                      "8px",
                    fontSize:
                      "12px",
                  }}
                >
                  {cameraName}
                </div>
              </>
            ) : (
              <div
                style={{
                  position:
                    "absolute",
                  inset: 0,
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background:
                    "#111827",
                  color:
                    "#9ca3af",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "60px",
                  }}
                >
                  ◉
                </div>

                <p
                  style={{
                    marginTop:
                      "10px",
                  }}
                >
                  Camera is Offline
                </p>
              </div>
            )}
          </div>

          <div
            className="camera-info"
            style={{
              padding:
                "22px",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "15px",
              }}
            >
              <h3>
                Main Gate Camera
              </h3>

              <span
                className={
                  cameraRunning
                    ? "camera-online"
                    : "camera-offline"
                }
              >
                {cameraRunning
                  ? "Online"
                  : "Offline"}
              </span>
            </div>

            <p>
              <strong>
                Camera ID:
              </strong>{" "}
              CAM-001
            </p>

            <p>
              <strong>
                Location:
              </strong>{" "}
              Main Campus Gate
            </p>

            {/* OCR PANEL */}

            <div
              style={{
                marginTop:
                  "18px",
                padding:
                  "18px",
                background:
                  "#f8fafc",
                border:
                  "1px solid #e5e7eb",
                borderRadius:
                  "12px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap:
                    "10px",
                  marginBottom:
                    "12px",
                }}
              >
                <strong>
                  Automatic Number Plate Recognition
                </strong>

                <span
                  style={{
                    color:
                      scanning
                        ? "#2563eb"
                        : cameraRunning
                        ? "#16a34a"
                        : "#6b7280",
                    fontWeight:
                      "700",
                  }}
                >
                  {scanning
                    ? "Scanning"
                    : cameraRunning
                    ? "Ready"
                    : "Offline"}
                </span>
              </div>

              {/* DETECTED NUMBER */}

              <div
                style={{
                  padding:
                    "16px",
                  background:
                    "#ffffff",
                  border:
                    "2px dashed #2563eb",
                  borderRadius:
                    "10px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "12px",
                    color:
                      "#6b7280",
                    marginBottom:
                      "6px",
                  }}
                >
                  Detected Number
                </div>

                <div
                  style={{
                    minHeight:
                      "35px",
                    fontSize:
                      "25px",
                    fontWeight:
                      "700",
                    letterSpacing:
                      "2px",
                    color:
                      detectedPlate
                        ? "#16a34a"
                        : "#111827",
                  }}
                >
                  {detectedPlate ||
                    "Waiting for vehicle..."}
                </div>
              </div>

              {/* OCR OUTPUT */}

              <div
                style={{
                  marginTop:
                    "12px",
                  padding:
                    "12px",
                  borderRadius:
                    "8px",
                  background:
                    "#111827",
                  color:
                    "#d1d5db",
                  fontSize:
                    "11px",
                  maxHeight:
                    "180px",
                  overflowY:
                    "auto",
                  whiteSpace:
                    "pre-wrap",
                  wordBreak:
                    "break-word",
                }}
              >
                <strong
                  style={{
                    color:
                      "#ffffff",
                  }}
                >
                  OCR Output:
                </strong>

                <div
                  style={{
                    marginTop:
                      "8px",
                  }}
                >
                  {ocrText ||
                    "No OCR result yet."}
                </div>
              </div>

              {/* STATUS */}

              <div
                style={{
                  marginTop:
                    "12px",
                  color:
                    "#6b7280",
                  fontSize:
                    "13px",
                  lineHeight:
                    "1.5",
                }}
              >
                {statusMessage}
              </div>
            </div>

            {/* BUTTONS */}

            <div
              style={{
                display:
                  "flex",
                gap:
                  "10px",
                flexWrap:
                  "wrap",
                marginTop:
                  "18px",
              }}
            >
              <button
                className="camera-view-btn"
                onClick={
                  startCamera
                }
                disabled={
                  cameraRunning
                }
              >
                Start Camera
              </button>

              <button
                className="camera-stop-btn"
                onClick={
                  stopCamera
                }
                disabled={
                  !cameraRunning
                }
              >
                Stop Camera
              </button>

              <button
                className="camera-scan-btn"
                onClick={
                  manualScan
                }
                disabled={
                  !cameraRunning ||
                  scanning ||
                  !ocrReady
                }
              >
                Scan Now
              </button>
            </div>

            {cameraRunning && (
              <div
                style={{
                  marginTop:
                    "14px",
                  padding:
                    "12px",
                  borderRadius:
                    "8px",
                  background:
                    "#ecfdf5",
                  color:
                    "#166534",
                  fontSize:
                    "13px",
                  fontWeight:
                    "600",
                }}
              >
                Full-frame automatic scanning is active.
                Vehicle ko kisi fixed green box mein
                rakhne ki zarurat nahi hai.
              </div>
            )}
          </div>
        </div>

        {/* PARKING CAMERA */}

        <div className="camera-card">
          <div
            className="camera-preview"
            style={{
              height:
                "300px",
              background:
                "#111827",
              display:
                "flex",
              flexDirection:
                "column",
              alignItems:
                "center",
              justifyContent:
                "center",
              color:
                "#9ca3af",
            }}
          >
            <div
              style={{
                fontSize:
                  "60px",
              }}
            >
              ◉
            </div>

            <p
              style={{
                marginTop:
                  "10px",
              }}
            >
              No Physical Camera Connected
            </p>
          </div>

          <div
            className="camera-info"
            style={{
              padding:
                "22px",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "15px",
              }}
            >
              <h3>
                Parking Camera
              </h3>

              <span className="camera-offline">
                Offline
              </span>
            </div>

            <p>
              <strong>
                Camera ID:
              </strong>{" "}
              CAM-002
            </p>

            <p>
              <strong>
                Location:
              </strong>{" "}
              Main Parking Area
            </p>

            <button
              className="camera-view-btn"
              disabled
              style={{
                opacity:
                  "0.6",
                cursor:
                  "not-allowed",
              }}
            >
              Camera Not Connected
            </button>
          </div>
        </div>
      </div>

      {/* RECENT DETECTIONS */}

      <div
        style={{
          maxWidth:
            "1200px",
          margin:
            "25px auto 0",
          background:
            "#ffffff",
          borderRadius:
            "15px",
          padding:
            "22px",
          boxShadow:
            "0 5px 20px rgba(0,0,0,.08)",
        }}
      >
        <h2
          style={{
            marginBottom:
              "15px",
            color:
              "#172b4d",
          }}
        >
          Recently Detected Vehicles
        </h2>

        {recentDetections.length ===
        0 ? (
          <p
            style={{
              color:
                "#6b7280",
            }}
          >
            No vehicles detected yet.
          </p>
        ) : (
          recentDetections.map(
            (item, index) => (
              <div
                key={`${item.plate}-${item.time}-${index}`}
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  padding:
                    "12px 0",
                  borderBottom:
                    "1px solid #e5e7eb",
                }}
              >
                <div>
                  <strong>
                    {item.plate}
                  </strong>

                  <div
                    style={{
                      marginTop:
                        "3px",
                      fontSize:
                        "12px",
                      color:
                        "#6b7280",
                    }}
                  >
                    {item.action}

                    {item.parkingSlot
                      ? ` • Parking ${item.parkingSlot}`
                      : ""}
                  </div>
                </div>

                <span
                  style={{
                    fontSize:
                      "12px",
                    color:
                      "#6b7280",
                  }}
                >
                  {item.time}
                </span>
              </div>
            )
          )
        )}
      </div>

      <canvas
        ref={canvasRef}
        style={{
          display:
            "none",
        }}
      />
    </div>
  );
}

export default Camera;