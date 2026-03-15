import { Button } from "@/components/ui/button"
import { OnboardingForm } from "@/components/onboarding/onboarding-form"

const Page = () => {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-24">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">ステップ 2 / 2</p>
        <h1 className="text-4xl font-bold tracking-tight">
          あなたについて教えてください
        </h1>
      </div>
      <OnboardingForm />
      <div className="flex justify-end gap-3">
        <Button type="submit" form="onboarding-form" size="lg">
          続ける →
        </Button>
      </div>
    </div>
  )
}

export default Page
