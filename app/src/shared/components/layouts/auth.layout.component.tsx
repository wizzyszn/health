import React from "react";
import bgImage from "@/assets/images/BG (1).png";
import Logo from "../logo.component.shared";
interface AuthLayoutProps {
  children?: React.ReactNode;
}
const testimonials = [
  {
    quote:
      "We love MEDIAPP! We had already heard great things about their care coordinators, so we knew exactly the level of professional support we were going to get",
    name: "Tom Wilson",
  },
  {
    quote:
      "MediApp transformed the way we manage patient records. The interface is intuitive, and the support team is always there when we need them.",
    name: "Sarah Chen",
  },
  {
    quote:
      "Since switching to MediApp, our clinic's efficiency has improved by 40%. It's the best investment we've made for our practice.",
    name: "Dr. James Rivera",
  },
  {
    quote:
      "The scheduling features alone saved us countless hours each week. MediApp truly understands the needs of healthcare professionals.",
    name: "Emily Nakamura",
  },
];

function AuthLayout({ children }: AuthLayoutProps) {
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const goToSlide = React.useCallback(
    (index: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setActiveSlide(index);
      setTimeout(() => setIsAnimating(false), 500);
    },
    [isAnimating],
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      goToSlide((activeSlide + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSlide, goToSlide]);

  return (
    <div>
      <div className="flex min-h-screen">
        {/* Left Panel - Testimonial */}
        <div className="hidden lg:flex lg:w-[35%] relative overflow-hidden">
          <img
            src={bgImage}
            alt="Happy MediApp user"
            className="absolute inset-0 w-full h-full object-contain object-left-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080911] via-[#171A2E]/30 to-transparent" />

          {/* Logo */}
          <div className="absolute top-6 left-6 z-10">
            <Logo isBackground />
          </div>

          {/* Testimonial Content */}
          <div className="absolute bottom-12 left-8 right-8 z-10 overflow-hidden">
            <div key={activeSlide} className="animate-fade-in">
              <p className="text-background/90 text-base leading-relaxed mb-4 ">
                {testimonials[activeSlide].quote}
              </p>
              <p className="text-background font-semibold text-sm">
                {testimonials[activeSlide].name}
              </p>
            </div>

            {/* Slide indicators */}
            <div className="flex gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === activeSlide
                      ? "w-10 bg-background"
                      : "w-6 bg-background/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex justify-center items-start lg:items-center bg-background relative px-4 sm:px-6 md:px-8 lg:px-12 pt-28 pb-12 lg:py-0">
          <div className="absolute top-6 left-6 block lg:hidden">
            <Logo isBackground />
          </div>
          <div className="w-full max-w-md xl:max-w-xl">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
