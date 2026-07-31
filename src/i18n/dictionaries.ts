import type { Locale } from "./config";
import type { AttributeKey } from "@/engine";

export type HomeDictionary = {
  brandName: string;
  brandHomeLabel: string;
  buildTag: string;
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  careerFormatLabel: string;
  footerLead: string;
  footerClosing: string;
  playCta: string;
  stats: ReadonlyArray<{
    label: string;
    value: string;
  }>;
};

export type PlayDictionary = {
  sliceBadge: string;
  sliceNote: string;
  backHome: string;
  loading: string;
  create: {
    heading: string;
    intro: string;
    nameLabel: string;
    namePlaceholder: string;
    nationalityLabel: string;
    nationalityPlaceholder: string;
    roleLabel: string;
    roleValue: string;
    roleNote: string;
    start: string;
    nameError: string;
    nationalityError: string;
  };
  hud: {
    seasonProgress: string;
    age: string;
    club: string;
    league: string;
  };
  decision: {
    heading: string;
    intro: string;
    choose: string;
    focusOn: string;
    noFocus: string;
    movesTo: string;
  };
  decisionKinds: {
    stay: { title: string; description: string };
    trainingFocus: { title: string; description: string };
    transfer: { title: string; description: string };
    roleChange: { title: string; description: string };
    retire: { title: string; description: string };
  };
  moment: {
    stepRead: string;
    stepChoose: string;
    stepExecute: string;
    readHeading: string;
    readIntro: string;
    pressureLabel: string;
    pressureLow: string;
    pressureMedium: string;
    pressureHigh: string;
    readContinue: string;
    chooseHeading: string;
    chooseIntro: string;
    executeHeading: string;
    executeIntro: string;
    directionLabel: string;
    directionHint: string;
    powerLabel: string;
    powerHint: string;
    timingLabel: string;
    timingHint: string;
    timingStart: string;
    timingStop: string;
    timingLocked: string;
    timingValue: string;
    submit: string;
    changeChoice: string;
    pitchLabel: string;
  };
  momentKinds: {
    shot: { title: string; situation: string };
    throughBall: { title: string; situation: string };
    dribble: { title: string; situation: string };
    tackle: { title: string; situation: string };
  };
  momentChoices: {
    shoot: string;
    pass: string;
    dribble: string;
    tackle: string;
  };
  directions: readonly string[];
  summary: {
    heading: string;
    outcomeLabel: string;
    scoreLabel: string;
    ratingLabel: string;
    whyLabel: string;
    changesHeading: string;
    attributeHeading: string;
    conditionHeading: string;
    noChange: string;
    nextSeason: string;
    finish: string;
    growthExplained: string;
    conditionExplained: string;
  };
  outcomes: {
    decisive: string;
    positive: string;
    neutral: string;
    poor: string;
  };
  factors: {
    choice: string;
    direction: string;
    power: string;
    timing: string;
    pressure: string;
    attribute: string;
  };
  end: {
    heading: string;
    intro: string;
    legacyLabel: string;
    legacyScale: string;
    provisional: string;
    timelineHeading: string;
    impactHeading: string;
    impactNone: string;
    impactTransfer: string;
    impactFocus: string;
    restart: string;
  };
  endTitles: {
    breakthrough: string;
    steady: string;
    raw: string;
  };
  attributes: Readonly<Record<AttributeKey, string>>;
  condition: {
    fitness: string;
    morale: string;
    sharpness: string;
    reputation: string;
  };
  saved: {
    restored: string;
    startOver: string;
    unsupported: string;
    broken: string;
  };
};

type AppDictionary = {
  home: HomeDictionary;
  play: PlayDictionary;
};

export const dictionaries: Record<Locale, AppDictionary> = {
  en: {
    home: {
      brandName: "ONE CAREER",
      brandHomeLabel: "ONE CAREER home",
      buildTag: "PRE-SEASON",
      eyebrow: "A football life in one sitting",
      title: "One career. Every decision counts.",
      description:
        "Build a player, survive the setbacks, and shape a complete football story in 20-30 minutes.",
      status: "Stage 1 · Building the first playable foundation",
      careerFormatLabel: "Career format",
      footerLead: "Career mode is being built.",
      footerClosing: "Your story starts soon.",
      playCta: "Play the three season slice",
      stats: [
        { value: "18-22", label: "seasons per career" },
        { value: "20-30", label: "minutes per run" },
        { value: "1", label: "career worth remembering" },
      ],
    },
    play: {
      sliceBadge: "SLICE",
      sliceNote:
        "A three season preview of the full career. Attack players only for now.",
      backHome: "Back to the home screen",
      loading: "Loading your run",
      create: {
        heading: "Create your player",
        intro:
          "Three seasons, three decisions, three decisive moments. Your name and nationality are yours alone and never change how the world behaves.",
        nameLabel: "Player name",
        namePlaceholder: "e.g. Dana Levi",
        nationalityLabel: "Nationality",
        nationalityPlaceholder: "e.g. Israel",
        roleLabel: "Role family",
        roleValue: "Attack",
        roleNote: "Midfield and defence arrive in a later slice.",
        start: "Start the slice",
        nameError: "Enter a player name to start.",
        nationalityError: "Enter a nationality to start.",
      },
      hud: {
        seasonProgress: "Season",
        age: "Age",
        club: "Club",
        league: "League",
      },
      decision: {
        heading: "Pre-season decision",
        intro: "One choice sets up the season. It changes how you train and where you play.",
        choose: "Choose this",
        focusOn: "Trains",
        noFocus: "No training focus",
        movesTo: "Moves to",
      },
      decisionKinds: {
        stay: {
          title: "Stay and fight for the shirt",
          description: "Keep your place, settle in and build trust with the staff.",
        },
        trainingFocus: {
          title: "Commit to extra training",
          description: "Sharper on the pitch, but the extra load costs you some enjoyment.",
        },
        transfer: {
          title: "Accept the transfer",
          description: "A bigger stage and a bigger reputation, at the cost of match sharpness.",
        },
        roleChange: {
          title: "Change your role",
          description: "Move to a different job on the pitch.",
        },
        retire: {
          title: "Retire",
          description: "End the career here.",
        },
      },
      moment: {
        stepRead: "Read",
        stepChoose: "Choose",
        stepExecute: "Execute",
        readHeading: "Read the moment",
        readIntro: "One moment decides your season. Look at the situation before you commit.",
        pressureLabel: "Pressure",
        pressureLow: "You have time",
        pressureMedium: "Closing down fast",
        pressureHigh: "Surrounded",
        readContinue: "I have read it",
        chooseHeading: "Choose your action",
        chooseIntro: "No success rate is shown. Read the situation and back yourself.",
        executeHeading: "Execute",
        executeIntro: "Aim, weight the ball and hit the moment.",
        directionLabel: "Direction",
        directionHint: "Where you aim, from the far left to the far right.",
        powerLabel: "Power",
        powerHint: "How hard you strike it, from 0 to 100.",
        timingLabel: "Timing",
        timingHint: "Stop the marker in the middle. Use the button, Space or Enter.",
        timingStart: "Start timing",
        timingStop: "Stop",
        timingLocked: "Timing locked",
        timingValue: "Your timing",
        submit: "Play the moment",
        changeChoice: "Change action",
        pitchLabel: "Pitch view of the moment",
      },
      momentKinds: {
        shot: {
          title: "Shooting chance",
          situation:
            "The ball drops to you on the edge of the box with the goal in front of you.",
        },
        throughBall: {
          title: "Killer pass",
          situation: "A runner breaks the last line and the defence has stepped up.",
        },
        dribble: {
          title: "One on one",
          situation: "A single defender stands between you and open space.",
        },
        tackle: {
          title: "Defensive duty",
          situation: "You lost the ball and the counter is already coming back at you.",
        },
      },
      momentChoices: {
        shoot: "Shoot",
        pass: "Pass",
        dribble: "Dribble",
        tackle: "Tackle",
      },
      directions: ["Far left", "Left", "Centre", "Right", "Far right"],
      summary: {
        heading: "Season summary",
        outcomeLabel: "Moment",
        scoreLabel: "Execution",
        ratingLabel: "Season rating",
        whyLabel: "What decided it",
        changesHeading: "What changed this season",
        attributeHeading: "Attributes",
        conditionHeading: "Condition",
        noChange: "Nothing moved this season.",
        nextSeason: "Next season",
        finish: "See how it ended",
        growthExplained: "Your training focus and your rating drove this growth.",
        conditionExplained: "Your decision and your rating moved these.",
      },
      outcomes: {
        decisive: "Decisive",
        positive: "Positive",
        neutral: "Neutral",
        poor: "Poor",
      },
      factors: {
        choice: "the action you picked",
        direction: "where you aimed",
        power: "how hard you hit it",
        timing: "your timing",
        pressure: "the pressure on you",
        attribute: "your ability",
      },
      end: {
        heading: "Three seasons in",
        intro: "This is where the slice ends. A full career runs 19 to 22 seasons.",
        legacyLabel: "Provisional Legacy",
        legacyScale: "out of 1000",
        provisional:
          "Provisional score. The final Legacy formula is defined together with game balancing.",
        timelineHeading: "Your timeline",
        impactHeading: "How your choices played out",
        impactNone: "Your choices kept you on the same path all three seasons.",
        impactTransfer: "Your season {season} transfer moved you to {club}.",
        impactFocus: "The training you chose in season {season} lifted {attribute} by {points}.",
        restart: "Start a new slice",
      },
      endTitles: {
        breakthrough: "Breakthrough talent",
        steady: "Steady riser",
        raw: "Raw prospect",
      },
      attributes: {
        pace: "Pace",
        technique: "Technique",
        passing: "Passing",
        finishing: "Finishing",
        defending: "Defending",
        physical: "Physical",
        vision: "Vision",
        mentality: "Mentality",
      },
      condition: {
        fitness: "Fitness",
        morale: "Morale",
        sharpness: "Sharpness",
        reputation: "Reputation",
      },
      saved: {
        restored: "Your run was restored from this device.",
        startOver: "Start over",
        unsupported:
          "That saved run was made by a different version of the game and cannot be loaded. Start a new one.",
        broken: "That saved run could not be read. Start a new one.",
      },
    },
  },
  he: {
    home: {
      brandName: "ONE CAREER",
      brandHomeLabel: "דף הבית של ONE CAREER",
      buildTag: "טרום עונה",
      eyebrow: "חיי כדורגל בסשן אחד",
      title: "קריירה אחת. כל החלטה קובעת.",
      description:
        "בנו שחקן, התמודדו עם משברים ועצבו סיפור כדורגל שלם בתוך 20-30 דקות.",
      status: "שלב 1 · בונים את הבסיס הראשון שניתן לשחק בו",
      careerFormatLabel: "מבנה הקריירה",
      footerLead: "מצב הקריירה נמצא בבנייה.",
      footerClosing: "הסיפור שלך מתחיל בקרוב.",
      playCta: "לשחק את פרוסת שלוש העונות",
      stats: [
        { value: "18-22", label: "עונות בכל קריירה" },
        { value: "20-30", label: "דקות בכל ריצה" },
        { value: "1", label: "קריירה ששווה לזכור" },
      ],
    },
    play: {
      sliceBadge: "פרוסה",
      sliceNote: "הצצה של שלוש עונות מתוך הקריירה המלאה. בשלב הזה שחקני התקפה בלבד.",
      backHome: "חזרה למסך הבית",
      loading: "טוען את הריצה שלך",
      create: {
        heading: "צרו את השחקן שלכם",
        intro:
          "שלוש עונות, שלוש החלטות ושלושה רגעים מכריעים. השם והלאום שלכם הם שלכם בלבד ואינם משנים את התנהגות העולם.",
        nameLabel: "שם השחקן",
        namePlaceholder: "לדוגמה: דנה לוי",
        nationalityLabel: "לאום",
        nationalityPlaceholder: "לדוגמה: ישראל",
        roleLabel: "משפחת תפקיד",
        roleValue: "התקפה",
        roleNote: "קישור והגנה יגיעו בפרוסה מאוחרת יותר.",
        start: "להתחיל את הפרוסה",
        nameError: "הזינו שם שחקן כדי להתחיל.",
        nationalityError: "הזינו לאום כדי להתחיל.",
      },
      hud: {
        seasonProgress: "עונה",
        age: "גיל",
        club: "מועדון",
        league: "ליגה",
      },
      decision: {
        heading: "החלטת טרום עונה",
        intro: "בחירה אחת מכינה את העונה. היא משנה איך תתאמנו ואיפה תשחקו.",
        choose: "בוחרים בזה",
        focusOn: "מאמן",
        noFocus: "בלי מיקוד אימון",
        movesTo: "מעבר אל",
      },
      decisionKinds: {
        stay: {
          title: "להישאר ולהילחם על החולצה",
          description: "לשמור על המקום, להתבסס ולבנות אמון מול הצוות.",
        },
        trainingFocus: {
          title: "להתחייב לאימון נוסף",
          description: "חדים יותר במגרש, אבל העומס הנוסף גובה מעט מההנאה.",
        },
        transfer: {
          title: "לקבל את ההצעה",
          description: "במה גדולה יותר ומוניטין גדול יותר, במחיר של חדות משחק.",
        },
        roleChange: {
          title: "לשנות תפקיד",
          description: "מעבר לתפקיד אחר במגרש.",
        },
        retire: {
          title: "לפרוש",
          description: "לסיים כאן את הקריירה.",
        },
      },
      moment: {
        stepRead: "קריאה",
        stepChoose: "בחירה",
        stepExecute: "ביצוע",
        readHeading: "קראו את הרגע",
        readIntro: "רגע אחד מכריע את העונה. הסתכלו על המצב לפני שאתם מתחייבים.",
        pressureLabel: "לחץ",
        pressureLow: "יש לכם זמן",
        pressureMedium: "סוגרים עליכם מהר",
        pressureHigh: "מוקפים",
        readContinue: "קראתי את המצב",
        chooseHeading: "בחרו פעולה",
        chooseIntro: "לא מוצג אחוז הצלחה. קראו את המצב וסמכו על עצמכם.",
        executeHeading: "ביצוע",
        executeIntro: "כוונו, שקללו את העוצמה ופגעו ברגע.",
        directionLabel: "כיוון",
        directionHint: "לאן אתם מכוונים, משמאל הרחוק עד ימין הרחוק.",
        powerLabel: "עוצמה",
        powerHint: "כמה חזק אתם בועטים, מ־0 עד 100.",
        timingLabel: "תזמון",
        timingHint: "עצרו את הסמן באמצע. אפשר בכפתור, ברווח או ב־Enter.",
        timingStart: "להתחיל תזמון",
        timingStop: "עצור",
        timingLocked: "התזמון ננעל",
        timingValue: "התזמון שלכם",
        submit: "לשחק את הרגע",
        changeChoice: "לשנות פעולה",
        pitchLabel: "תצוגת מגרש של הרגע",
      },
      momentKinds: {
        shot: {
          title: "הזדמנות לבעיטה",
          situation: "הכדור נוחת אליכם בקצה הרחבה והשער מולכם.",
        },
        throughBall: {
          title: "מסירת מפתח",
          situation: "חלוץ פורץ את הקו האחרון וההגנה עלתה קדימה.",
        },
        dribble: {
          title: "אחד על אחד",
          situation: "מגן אחד עומד בינכם לבין שטח פתוח.",
        },
        tackle: {
          title: "חובת הגנה",
          situation: "איבדתם את הכדור והמתפרצת כבר חוזרת אליכם.",
        },
      },
      momentChoices: {
        shoot: "בעיטה",
        pass: "מסירה",
        dribble: "כדרור",
        tackle: "חטיפה",
      },
      directions: ["שמאל רחוק", "שמאל", "מרכז", "ימין", "ימין רחוק"],
      summary: {
        heading: "סיכום העונה",
        outcomeLabel: "הרגע",
        scoreLabel: "ביצוע",
        ratingLabel: "דירוג העונה",
        whyLabel: "מה הכריע",
        changesHeading: "מה השתנה העונה",
        attributeHeading: "תכונות",
        conditionHeading: "מדדים",
        noChange: "שום דבר לא זז העונה.",
        nextSeason: "לעונה הבאה",
        finish: "לראות איך זה נגמר",
        growthExplained: "מיקוד האימון והדירוג שלכם הניעו את ההתפתחות הזו.",
        conditionExplained: "ההחלטה שלכם והדירוג הזיזו את המדדים האלה.",
      },
      outcomes: {
        decisive: "מכריע",
        positive: "חיובי",
        neutral: "בינוני",
        poor: "חלש",
      },
      factors: {
        choice: "הפעולה שבחרתם",
        direction: "לאן כיוונתם",
        power: "כמה חזק בעטתם",
        timing: "התזמון שלכם",
        pressure: "הלחץ שהופעל עליכם",
        attribute: "היכולת שלכם",
      },
      end: {
        heading: "אחרי שלוש עונות",
        intro: "כאן הפרוסה נגמרת. קריירה מלאה נמשכת 19 עד 22 עונות.",
        legacyLabel: "Legacy זמני",
        legacyScale: "מתוך 1000",
        provisional: "ציון זמני. נוסחת ה־Legacy הסופית תיקבע יחד עם איזון המשחק.",
        timelineHeading: "ציר הזמן שלכם",
        impactHeading: "איך הבחירות שלכם התגלגלו",
        impactNone: "הבחירות שלכם השאירו אתכם באותו מסלול בכל שלוש העונות.",
        impactTransfer: "המעבר שבחרתם בעונה {season} הביא אתכם ל{club}.",
        impactFocus: "האימון שבחרתם בעונה {season} העלה את {attribute} ב־{points}.",
        restart: "להתחיל פרוסה חדשה",
      },
      endTitles: {
        breakthrough: "כישרון פורץ",
        steady: "עולה בהתמדה",
        raw: "חומר גלם",
      },
      attributes: {
        pace: "מהירות",
        technique: "טכניקה",
        passing: "מסירה",
        finishing: "סיומת",
        defending: "הגנה",
        physical: "פיזיות",
        vision: "ראיית משחק",
        mentality: "מנטליות",
      },
      condition: {
        fitness: "כושר",
        morale: "מורל",
        sharpness: "חדות",
        reputation: "מוניטין",
      },
      saved: {
        restored: "הריצה שלכם שוחזרה מהמכשיר הזה.",
        startOver: "להתחיל מחדש",
        unsupported:
          "הריצה השמורה נוצרה בגרסה אחרת של המשחק ואי אפשר לטעון אותה. התחילו ריצה חדשה.",
        broken: "לא הצלחנו לקרוא את הריצה השמורה. התחילו ריצה חדשה.",
      },
    },
  },
};
