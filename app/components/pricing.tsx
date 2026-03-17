import Link from "next/link";
import { FaCheck } from "react-icons/fa6";

export default function Pricing(){
    const plans = [
        {
            highlight : false,
            planType : "Basic",
            name : "Mock Tests",
            strikeThrough : "Rs. 249",
            pricing : "Rs. 149",
            description : "Practice with CUET level Mocks",
            includes : [
                "Full Length Mocks",
                "Rank Prediction",
                "Leaderboard",
                "Performance Analytics",
                "Detailed Solutions"
            ],
        },
        {
            highlight : true,
            planType : "Pro",
            name : "Crash Course",
            strikeThrough : "Rs. 5999",
            pricing : "Rs. 2999",
            description : "Complete CUET preparation and college guidance.",
            includes : [
                "Fast Track Revision Classes",
                "PYQ Practice Session",
                "Marathon Revision Classes",
                "Mock Tests Access",
                "Mentorship Community",
                "CUET Aspirant Discussion Group",
                "DU Preference Filing Guidance",
                "Admission Walkthrough",
                "Accomdation & Fresher Guide",
            ],
        },
        {
            highlight : false,
            planType : "Advance",
            name : "Crash Course Pro",
            strikeThrough : "Rs. 6499",
            pricing : "Rs. 3999",
            description : "Crash Course & Bonus guidance",
            includes : [
                "Everything In Crash Course",
                "Extra Stratergy Workshop",
                "Live Mock Analysis Session",
                "DU College Deep Dive Sessions",
                "Alumini Network",
            ],
        },
    ];
    return(
        <main className="max-w-6xl py-12 mx-auto px-4">
            <div className="flex flex-col gap-2 justify-center items-center">
                <span className="text-3xl md:text-4xl font-semibold text-center">Choose Your Plan</span>
                <h1 className="text-base md:text-lg text-center max-w-xl px-4">
                    India{"\'"}s first CUET program that prepares you for both the exam and your college life.
                </h1>
            </div>

            <div className="flex flex-col md:flex-row md:flex-wrap gap-6 justify-center py-12 px-4">
                {plans.map((item, index) => (
                    <div className="" key={index}>
                        {item.highlight === true ? 
                        <div className="relative p-0.5 bg-linear-to-br from-neutral-200 via-neutral-300 to-neutral-200 rounded-2xl hover:scale-105 duration-300">
                            <div className="flex flex-col gap-2 items-center justify-center w-full sm:w-sm md:w-xs bg-neutral-50 rounded-2xl">
                            <span className="text-xs bg-emerald-400 mt-8 px-6 uppercase py-2 rounded-full border">{item.planType}</span>
                            <div className="flex flex-col px-6 py-2">
                                <span className="line-through text-sm">{item.strikeThrough}</span>
                                <span className="text-4xl">{item.pricing}
                                    <span className="font-light text-xl">/mo</span>
                                </span>
                            </div>
                            <span className="text-lg px-6">{item.name}</span>
                            <span className="text-center text-sm text-neutral-700 px-6">{item.description}</span>
                            <div className="px-6 my-4 w-full">
                                <Link href="/" className="w-full flex items-center justify-center bg-purple-300 rounded-full text-lg rounded-full py-2 border">Buy Now</Link>
                            </div>
                            <span className="w-full text-left px-8 text-md">Features :</span>
                            <ul className="text-sm flex flex-col items-start pb-4 px-6">
                                {item.includes.map((item, index) => (
                                    <li key={index} className="flex gap-2 items-center">
                                        <FaCheck />{item}
                                    </li>
                                ))}
                            </ul>
                            <div className="bg-black w-full flex items-center justify-center py-2 rounded-b-2xl">
                                <span className="text-xs text-neutral-400">Early Batch Price. Limited Seats</span>
                            </div>
                        </div> 
                        </div>
                        : 
                        <div className="flex flex-col gap-2 bg-white rounded-2xl border border-neutral-300 hover:scale-105 duration-300 items-center justify-center w-full sm:w-sm md:w-xs">
                            <span className="text-xs bg-emerald-400 mt-8 px-6 uppercase py-2 rounded-full border">{item.planType}</span>
                            <div className="flex flex-col px-6 py-2">
                                <span className="line-through text-sm">{item.strikeThrough}</span>
                                <span className="text-4xl">{item.pricing}
                                    <span className="font-light text-xl">/mo</span>
                                </span>
                            </div>
                            <span className="text-lg px-6">{item.name}</span>
                            <span className="text-center text-sm text-neutral-700 px-6">{item.description}</span>
                            <div className="px-6 my-4 w-full">
                                <Link href="/" className="w-full flex items-center justify-center border text-lg rounded-full py-2 bg-blue-300">Buy Now</Link>
                            </div>
                            <span className="w-full text-left px-8 text-md">Features :</span>
                            <ul className="text-sm px-8 w-full flex flex-col items-start pb-4">
                                {item.includes.map((item, index) => (
                                    <li key={index} className="flex gap-2 items-center">
                                        <FaCheck />{item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        }
                    </div>
                ))}
            </div>
        </main>
    );
}