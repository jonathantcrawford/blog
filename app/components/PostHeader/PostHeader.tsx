

export const PostHeader = ({ info }: any) => {
  return (
    <div className="bg-pink-200 text-black-100 no-underline rounded-xl border-6 border-solid border-pink-200 p-4 flex flex-col mt-2 mb-4">
      <span className="text-4xl font-extrabold font-saygon pb-2">
        {info.emoji} {info.title}
      </span>
      <span className="text-xl font-medium font-saygon pb-4">
        {info.subTitle}
      </span>
      <span className="font-medium font-saygon text-right text-base">
        {new Date(info.updatedAt).toDateString()}
      </span>
    </div>
  );
};
