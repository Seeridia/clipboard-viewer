import {
  AlignLeft,
  Braces,
  Code2,
  FileType,
  HardDrive,
  Languages,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { ClipboardDataItem, FileInfo } from "../types";
import { formatBytes } from "../utils/format";

const labels: Record<string, string> = {
  lines: "行数",
  words: "词数",
  characters: "字符数",
  charactersNoSpaces: "非空白字符",
  structure: "HTML 结构",
  styling: "样式与脚本",
  rtfInfo: "RTF 信息",
  jsonInfo: "JSON 信息",
  hasDoctype: "DOCTYPE",
  hasHtmlTag: "HTML 标签",
  hasHeadTag: "Head 标签",
  hasBodyTag: "Body 标签",
  isComplete: "完整文档",
  elements: "元素统计",
  images: "图片",
  links: "链接",
  tables: "表格",
  forms: "表单",
  styleTags: "样式标签",
  scriptTags: "脚本标签",
  inlineStyles: "内联样式",
  hasValidHeader: "有效文件头",
  version: "版本",
  charset: "字符集",
  isValid: "格式有效",
  type: "数据类型",
  keys: "顶层键数",
  error: "错误",
  name: "文件名",
  size: "文件大小",
  lastModified: "最后修改",
  title: "文档标题",
  source: "数据来源",
  transferEncoding: "传输编码",
};
const languages: Record<string, string> = {
  "zh-CN": "中文",
  en: "英语",
  ja: "日语",
  ko: "韩语",
  ru: "俄语",
  el: "希腊语",
};
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  className = "",
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={`metadata-metric ${className}`}>
      <dt>
        {Icon && <Icon size={17} aria-hidden="true" />}
        {label}
      </dt>
      <dd>{value}</dd>
      {detail && <dd className="metadata-detail">{detail}</dd>}
    </div>
  );
}

function displayValue(key: string, value: unknown): ReactNode {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean")
    return (
      <span className={`metadata-status ${value ? "is-positive" : ""}`}>
        {value ? "是" : "否"}
      </span>
    );
  if (key === "lastModified" && typeof value === "number")
    return new Date(value).toLocaleString("zh-CN", { hour12: false });
  if (key === "size" && typeof value === "number") {
    const size = formatBytes(value);
    return (
      <>
        {size.value}
        <span className="metadata-unit">{size.unit}</span>
      </>
    );
  }
  if (typeof value === "number") return value.toLocaleString();
  if (Array.isArray(value)) return value.map(String).join("、") || "—";
  return String(value);
}

function MetadataGroup({
  title,
  data,
  icon: Icon = Code2,
}: {
  title: string;
  data: Record<string, unknown>;
  icon?: LucideIcon;
}) {
  const entries = Object.entries(data);
  if (!entries.length) return null;
  return (
    <section className="metadata-group" aria-label={title}>
      <h4>
        <Icon size={17} aria-hidden="true" />
        {title}
      </h4>
      <dl className="metadata-metrics-grid">
        {entries
          .filter(([, value]) => !isRecord(value))
          .map(([key, value]) => (
            <MetricCard
              key={key}
              label={labels[key] || key}
              value={displayValue(key, value)}
              className={
                typeof value === "number"
                  ? "metadata-numeric"
                  : "metadata-compact-value"
              }
            />
          ))}
      </dl>
      {entries
        .filter(([, value]) => isRecord(value))
        .map(([key, value]) => (
          <MetadataGroup
            key={key}
            title={labels[key] || key}
            data={value as Record<string, unknown>}
          />
        ))}
    </section>
  );
}

export function MetadataViewer({
  item,
  fileInfo,
}: {
  item: ClipboardDataItem;
  fileInfo: FileInfo | null;
}) {
  const metadata = item.metadata || {};
  const size = formatBytes(item.size);
  const commonKeys = new Set([
    "mimeType",
    "formattedSize",
    "fileInfo",
    "encoding",
    "language",
    "charset",
    "textStats",
  ]);
  const stats = isRecord(metadata.textStats) ? metadata.textStats : null;
  const fileMetadata = isRecord(metadata.fileInfo) ? metadata.fileInfo : {};
  const language = metadata.language;
  const encoding = metadata.encoding;

  return (
    <div className="metadata-dashboard">
      <dl className="metadata-overview">
        <MetricCard
          label="MIME 类型"
          icon={FileType}
          value={metadata.mimeType || item.type}
          className="metadata-mime"
        />
        <MetricCard
          label="数据大小"
          icon={HardDrive}
          value={
            <>
              {size.value}
              <span className="metadata-unit">{size.unit}</span>
            </>
          }
          detail={`${item.size.toLocaleString()} 字节`}
          className="metadata-numeric"
        />
        {language && (
          <MetricCard
            label="语言（推测）"
            icon={Languages}
            value={languages[language] || language}
            detail={languages[language] ? language : undefined}
          />
        )}
        {encoding && (
          <MetricCard
            label="编码（推测）"
            icon={Braces}
            value={
              encoding === "utf-8"
                ? "UTF-8"
                : encoding === "corrupted"
                  ? "编码异常"
                  : encoding
            }
          />
        )}
        {metadata.charset && (
          <MetricCard label="字符集" value={metadata.charset} />
        )}
      </dl>
      {stats && (
        <MetadataGroup title="文本统计" data={stats} icon={AlignLeft} />
      )}
      {(fileInfo?.name || Object.keys(fileMetadata).length > 0) && (
        <MetadataGroup
          title="文件信息"
          data={{
            ...fileMetadata,
            ...(fileInfo?.name ? { name: fileInfo.name } : {}),
          }}
        />
      )}
      {Object.entries(metadata)
        .filter(([key, value]) => !commonKeys.has(key) && isRecord(value))
        .map(([key, value]) => (
          <MetadataGroup
            key={key}
            title={labels[key] || key}
            data={value as Record<string, unknown>}
          />
        ))}
      <dl className="metadata-overview metadata-additional">
        {Object.entries(metadata)
          .filter(([key, value]) => !commonKeys.has(key) && !isRecord(value))
          .map(([key, value]) => (
            <MetricCard
              key={key}
              label={labels[key] || key}
              value={displayValue(key, value)}
              className="metadata-compact-value"
            />
          ))}
      </dl>
    </div>
  );
}
