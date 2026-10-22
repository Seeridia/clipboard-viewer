export const formatBytes = (bytes: number) => {
  if (!bytes) return { value: "0", unit: "B" };
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
  return {
    value: Number((bytes / 1024 ** index).toFixed(index ? 1 : 0)).toString(),
    unit: ["B", "KiB", "MiB", "GiB"][index],
  };
};

export const formatName = (type: string) =>
  ({
    "text/plain": "纯文本",
    "text/html": "HTML",
    "text/rtf": "RTF",
    "application/json": "JSON",
    "application/xml": "XML",
    "application/pdf": "PDF",
    files: "文件",
    unknown: "未知格式",
  })[type] ||
  (type.startsWith("image/")
    ? `${type.split("/")[1].toUpperCase()} 图片`
    : type);
