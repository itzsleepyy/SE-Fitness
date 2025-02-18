import { Link } from 'react-router-dom';
import { Activity, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function Home() {
  const { user } = useAuth();

  const features = [
    {
      name: 'Track Your Progress',
      description: 'Log your exercises, diet, and monitor your health metrics in one place.',
      icon: Activity,
    },
    {
      name: 'Set & Achieve Goals',
      description: 'Create personalized fitness goals and track your journey to success.',
      icon: Target,
    },
    {
      name: 'Join Groups',
      description: 'Connect with like-minded individuals and achieve your goals together.',
      icon: Users,
    },
  ];

  return (
    <div className="relative isolate">
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              {user ? `Welcome back, ${user.username}!` : 'Your Journey to Better Health Starts Here'}
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              {user
                ? 'Continue your fitness journey, track your progress, and achieve your health goals.'
                : 'Track your fitness journey, set meaningful goals, and connect with others who share your passion for health and wellness.'}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button size="lg">Go to Dashboard</Button>
                  </Link>
                  <Link to="/groups">
                    <Button variant="outline" size="lg">Join a Group</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg">Get Started</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg">Sign In</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mx-auto mt-32 max-w-2xl sm:mt-40 lg:mt-56 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}