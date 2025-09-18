import { useRouter } from 'next/router';

const BackArrow = ({ href }: { href?: string }) => {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href); // Navigate to a specific route if `href` is provided
    } else {
      router.back(); // Go back to the previous page if no `href` is provided
    }
  };

  return (
    <button
      onClick={handleBack}
      className="btn btn-outline btn-sm flex items-center gap-2 hover:btn-primary hover:text-primary-content transition-all duration-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
};

export default BackArrow;
