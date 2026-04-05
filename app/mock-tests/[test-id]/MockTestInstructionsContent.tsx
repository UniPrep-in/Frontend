type InstructionSection = {
  title?: string;
  items: Array<{
    text: string;
    children?: string[];
    paletteItems?: Array<{
      marker: string;
      markerClassName: string;
      description: string;
      badge?: {
        className: string;
      };
    }>;
  }>;
};

const instructionSections: InstructionSection[] = [
  {
    items: [
      {
        text: "The clock will be set at the server. The countdown timer in the top right corner of the screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end itself. You will not be required to end or submit your examination.",
      },
      {
        text: "The question palette displayed on the right side of screen will show the status of each question using one of the following symbols:",
        paletteItems: [
          {
            marker: "1",
            markerClassName:
              "rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs sm:text-[16px]",
            description: "You have not visited the question yet.",
          },
          {
            marker: "2",
            markerClassName:
              "rounded-t-full bg-red-500 px-4 py-2 text-xs text-white sm:text-[16px]",
            description: "You have not answered the question",
          },
          {
            marker: "3",
            markerClassName:
              "rounded-t-full bg-green-500 px-4 py-2 text-xs text-white sm:text-[16px]",
            description: "You have answered the question.",
          },
          {
            marker: "4",
            markerClassName:
              "rounded-full bg-purple-600 px-4 py-2 text-xs text-white sm:text-[16px]",
            description:
              "The question(s) marked for review will not be considered for evaluation",
          },
          {
            marker: "5",
            markerClassName:
              "relative rounded-full bg-purple-600 px-4 py-2 text-xs text-white sm:text-[16px]",
            description:
              "The question(s) answered and marked for review will be considered for evaluation.",
            badge: {
              className:
                "absolute right-[-2px] top-7 h-3 w-3 rounded-full bg-green-500",
            },
          },
        ],
      },
    ],
  },
  {
    title: "Navigating to a question:",
    items: [
      {
        text: "To answer a question do the following :",
        children: [
          "Click on the question number in the question palette at the right of your screen to go to that numbered question directly.",
          "Click on Save & Next to save your answer for the current question and then go to the next question.",
          "Click on Mark for Review & Next to save your answer for the current question, mark for review, and then go to the next question.",
        ],
      },
    ],
  },
  {
    title: "Answering a Question:",
    items: [
      {
        text: "Procedure for answering a multiple choice type question:",
        children: [
          "To select your answer, click on the button of one of the options",
          "To deselect your chosen answer, click on the button of the chosen option again or click on the Clear Response button.",
          "To change your chosen answer, click on the button of another option.",
          "To save your answer, you MUST click on Save & Next button.",
          "To mark the question for review, click on the Mark for Review & Next button.",
          "To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.",
        ],
      },
    ],
  },
  {
    title: "Security & Fairness Protocols:",
    items: [
      {
        text: "Attempts Policy: Each mock test is strictly limited. However, candidates may review their answers and detailed solutions unlimited times.",
      },
      {
        text: "Watermarking: To maintain exam integrity, a user-specific watermark is displayed across the interface, adhering to standard NTA security protocols",
      },
      {
        text: "Full-Screen Enforcement: For fairness and discipline, candidates are strictly prohibited from exiting Full-Screen Mode.",
        children: [
          "You are allotted 2 warnings per mock.",
          "Violation of this rule (exiting full screen more than twice) will result in automatic submission of your test.",
        ],
      },
    ],
  },
];

export const PROCEED_CONFIRMATION_TEXT =
  "I have read and understood the instruction. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this test and/or to disciplinary action which may include ban from future Tests/Examinations.";

export default function MockTestInstructionsContent({
  title,
  durationMinutes,
}: {
  title: string;
  durationMinutes: number;
}) {
  return (
    <>
      <div className="border-b pb-4">
        <h1 className="text-lg font-semibold text-black sm:text-2xl">
          General Instruction
        </h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Test
            </p>
            <p className="mt-1 text-sm font-medium text-black sm:text-base">
              {title}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Duration
            </p>
            <p className="mt-1 text-sm font-medium text-black sm:text-base">
              {durationMinutes} minutes
            </p>
          </div>
        </div>
      </div>

      <ul className="list-decimal space-y-2 p-6 text-black">
        <li className="text-sm sm:text-[16px]">
          Total duration of this mock test is {durationMinutes} minutes.
        </li>

        {instructionSections.map((section) => (
          <div key={section.title ?? "general"}>
            {section.title ? (
              <h2 className="pt-8 text-lg font-semibold text-black underline underline-offset-2 sm:text-2xl">
                {section.title}
              </h2>
            ) : null}

            {section.items.map((item) => (
              <li key={item.text} className="text-xs sm:text-[16px]">
                {item.text}

                {item.paletteItems ? (
                  <div className="my-4 flex flex-col gap-4 rounded-lg border border-neutral-200 bg-neutral-100 p-4">
                    {item.paletteItems.map((paletteItem) => (
                      <div
                        key={paletteItem.marker}
                        className="flex items-center gap-4"
                      >
                        <div className={paletteItem.markerClassName}>
                          {paletteItem.marker}
                          {paletteItem.badge ? (
                            <span className={paletteItem.badge.className} />
                          ) : null}
                        </div>
                        <span className="text-xs sm:text-[16px]">
                          {paletteItem.description}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {item.children ? (
                  <ul className="flex list-disc flex-col gap-2 px-4">
                    {item.children.map((child) => (
                      <li key={child}>{child}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </div>
        ))}
      </ul>
    </>
  );
}
