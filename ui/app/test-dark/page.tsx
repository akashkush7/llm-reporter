export default function TestDarkMode() {
  return (
    <div className="min-h-screen p-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Dark Mode Test
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          If you can see this text changing color, dark mode is working!
        </p>
        <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900 rounded">
          <p className="text-blue-900 dark:text-blue-100">
            This box should change from light blue to dark blue
          </p>
        </div>
      </div>
    </div>
  );
}
