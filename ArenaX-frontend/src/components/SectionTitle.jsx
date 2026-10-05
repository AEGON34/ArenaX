function SectionTitle({ label, title, description }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">

      <p className="mb-4 text-xs font-bold tracking-[0.3em] text-red-500">
        {label}
      </p>

      <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
        {title}
      </h2>

      {description && (
        <p className="mt-5 leading-7 text-zinc-500">
          {description}
        </p>
      )}

    </div>
  );
}

export default SectionTitle;