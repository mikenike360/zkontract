import { useState } from 'react';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import { useRouter } from 'next/router';
import BackArrow from '@/components/ui/BackArrow';

const PostBountyPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    deadline: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Bounty submitted:', formData); // Replace this with smart contract interaction later
    alert('Bounty posted successfully!');
    router.push('/board'); // Redirect to the board page
  };

  return (
    <>
      <NextSeo
        title="zKontract | Post a Bounty"
        description="Post a new bounty to the zKontract system."
      />
      
      <div className="text-black mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Arrow */}
        <div className="mb-6">
          <BackArrow />
        </div>
  
        <h1 className="text-2xl font-bold text-white dark:text-white text-center mb-8">
          Post a Bounty
        </h1>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-black dark:text-black"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-black"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-black dark:text-black"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-black"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="reward"
              className="block text-sm font-medium text-black dark:text-black"
            >
              Reward (ALEO)
            </label>
            <input
              type="text"
              id="reward"
              name="reward"
              value={formData.reward}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-black"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="deadline"
              className="block text-sm font-medium text-black dark:text-black"
            >
              Deadline
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-black"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-black rounded-md shadow hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Post Bounty
          </button>
        </form>
      </div>
    </>
  );
};

PostBountyPage.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>{page}</Layout>;
};

export default PostBountyPage;
