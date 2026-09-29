import { LearningStudio } from "@/components/learning-studio";
import { concepts, glossary } from "@/lib/content";

export default function Home() {
  return <LearningStudio concepts={concepts} glossary={glossary} />;
}
