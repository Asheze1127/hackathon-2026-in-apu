import { PageLayout } from "@/components/shared/page-layout"
import { OnboardingForm } from "@/components/onboarding/onboarding-form"

const Page = () => {
  return (
    <PageLayout>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">ステップ 2 / 2</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
          あなたについて教えてください
        </h1>
      </div>
      <OnboardingForm />
    </PageLayout>
  )
}

export default Page
