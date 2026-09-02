export default function BrandLogo({
  size = 56,
  showText = true,
  showSubtitle = true,
  className = "",
  titleClassName = "text-xl",
  subtitleClassName = "text-xs",
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/logo.png"
        alt="تحدي العشرة الأوائل"
        width={size}
        height={size}
        className="shrink-0 rounded-[20px] object-cover shadow-lg shadow-indigo-200/35"
      />

      {showText && (
        <div className="min-w-0">
          <p
            className={`${titleClassName} whitespace-nowrap font-black text-slate-950`}
          >
            تحدي العشرة الأوائل
          </p>

          {showSubtitle && (
            <p
              className={`${subtitleClassName} mt-0.5 whitespace-nowrap font-bold text-slate-400`}
            >
              Top 10 Challenge
            </p>
          )}
        </div>
      )}
    </div>
  );
}
