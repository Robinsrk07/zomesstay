const Loader = () => {
  return (
    <div className="flex items-center justify-center w-full h-[400px]">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-blue-800 animate-spin"></div>
        <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-600 animate-spin absolute top-4 left-4"></div>
      </div>
    </div>
  );
};

export default Loader;