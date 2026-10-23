import type { Book, Language } from "@/shared/types";
import { filipinoBooks } from "./filipinoBooks";

export const sampleBooks: Book[] = [
  {
    id: "fox",
    coverId: "fox",
    jacket: "indigo",
    title: "The Brave Little Fox",
    text: `The small fox ran through the enormous forest. It was a cold day, and snow covered every tree and path. The fox whispered to itself: "What an adventure this is!" It searched for food in the wide wilderness, determined and brave. Then it found a quiet home behind a smooth stone. The fox felt safe and happy at last.`,
  },
  {
    id: "star",
    coverId: "star",
    jacket: "mango",
    title: "Maria and the Shining Star",
    text: `Maria looked up at the night sky and saw a magnificent star. "Can I reach it?" she asked her lola. Her lola smiled and said: "Every star brings hope and knowledge." Maria was curious and excited. She began to read books about the planets and the world above. She discovered that if you learn and believe in yourself, you can do wonderful things.`,
  },
  {
    id: "pedro",
    coverId: "rice",
    jacket: "kangkong",
    title: "Pedro and the Rice Field",
    text: `Pedro helped his father in the rice field every morning. The weather was bright and warm. He saw a peculiar bird sitting on a tall tree near the water. He walked slowly and carefully to look at it. His father told him: "We must protect the land and all the animals that live here." Pedro heard his father and felt happy and strong to help his family grow food.`,
  },
  {
    id: "rainbow",
    coverId: "rainbow",
    jacket: "gumamela",
    title: "The Rainbow After the Rain",
    text: `After the heavy rain stopped, Lina ran outside to look at the sky. She saw a beautiful rainbow going from one mountain to another. The colors were bright and amazing. Her brother called from the door: "Come back inside! The ground is still wet!" But Lina waited and whispered: "I always want to remember this wonderful sight." Her heart felt full and happy.`,
  },
  {
    id: "turtle",
    coverId: "turtle",
    jacket: "indigo",
    title: "The Slow and Steady Turtle",
    text: `A small turtle lived near a gentle river in the forest. Every day it walked slowly along the narrow path to find food. The other animals laughed because it was so slow. But the turtle was patient and never gave up. One day, a loud storm came and the fast animals ran and hid. The turtle found a safe place under a heavy stone and waited until everything was quiet and safe. Being slow and careful saved the day.`,
  },
  {
    id: "market",
    coverId: "basket",
    jacket: "mango",
    title: "A Day at the Market",
    text: `Ana went to the market early in the morning with her mother. The place was loud and full of colors. She saw fish, sweet fruit, and food everywhere she looked. Her mother told her how to pick the best food. Ana helped carry the heavy bags without a word. On the way home, her mother said: "You are so helpful and kind today." Ana smiled and felt happy. She learned something important that day.`,
  },
];

export { filipinoBooks };

/** Every bundled book, English first. */
export const allBooks: Book[] = [...sampleBooks, ...filipinoBooks];

/** The books a child can read: English stories to tap English words, Filipino stories to tap Filipino words. */
export function booksFor(language: Language): Book[] {
  return language === "english" ? filipinoBooks : sampleBooks;
}

export function findBook(id: string): Book | undefined {
  return allBooks.find((b) => b.id === id);
}
