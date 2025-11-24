import React, { useState } from 'react';

const Img = ({ url, caption }) => {
  return (
    <div className="my-8 flex flex-col items-center">
      <img
        src={url}
        alt="Post_Image"
        className="w-full max-w-4xl max-h-[500px] object-contain rounded-2xl shadow-2xl"
      />
      {caption && caption.length > 0 && (
        <p className="mt-4 text-center text-2xl text-gray-600 italic">
          {caption}
        </p>
      )}
    </div>
  );
};

const CodeBlock = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy code: ', err));
  };

  return (
    <div className="relative my-8">
      <pre className="bg-black text-white p-4 rounded-2xl overflow-x-auto font-mono text-base shadow-lg">
        <code>{code}</code>
      </pre>
      <button
        onClick={copyToClipboard}
        className="absolute top-3 right-3 bg-gray-200 hover:bg-gray-300 text-xs text-gray-700 py-1 px-3 rounded shadow">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
};

const LinkToolBlock = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(data.link)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy link: ', err));
  };

  return (
    <div className="relative my-8 max-w-xl mx-auto border rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-blue-100 shadow-2xl">
      {data.meta && data.meta.image && data.meta.image.url && (
        <img
          src={data.meta.image.url}
          alt={data.meta.title || "Link preview"}
          className="w-full h-64 object-contain rounded-lg mb-6"
        />
      )}
      <a
        href={data.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-blue-700 hover:text-blue-800 text-2xl  mb-4"
      >
        {data.meta && data.meta.title ? data.meta.title : data.link}
      </a>
      {data.meta && data.meta.description && (
        <p className="mt-4 text-blue-800 text-xl" dangerouslySetInnerHTML={{ __html: data.meta.description }} />
      )}
      <button
        onClick={copyLink}
        className="absolute top-3 right-3 bg-gray-200 hover:bg-gray-300 text-xs text-gray-700 py-1 px-3 rounded shadow"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
};

const YouTubeEmbed = ({ data }) => {
  return (
    <div className="my-8">
      <div className="aspect-video w-full">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${getYoutubeVideoId(data.url)}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-xl shadow-lg"
        ></iframe>
      </div>
    </div>
  );
};

const getYoutubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const BlogContent = ({ block }) => {
  const { type, data } = block;

  switch (type) {
    case "paragraph":
      return (
        <p
          className="my-6 text-xl leading-relaxed text-gray-800"
          dangerouslySetInnerHTML={{ __html: data.text }}
        />
      );
    case "header":
      if (data.level === 1)
        return (
          <h1
            className="my-8 text-5xl font-extrabold text-gray-900"
            dangerouslySetInnerHTML={{ __html: data.text }}
          />
        );
      if (data.level === 2)
        return (
          <h2
            className="my-7 text-4xl font-bold text-gray-900"
            dangerouslySetInnerHTML={{ __html: data.text }}
          />
        );
      if (data.level === 3)
        return (
          <h3
            className="my-6 text-3xl font-semibold text-gray-900"
            dangerouslySetInnerHTML={{ __html: data.text }}
          />
        );
      return null;
    case "image":
      return <Img url={data.file.url} caption={data.caption || ""} />;
    case "code":
      return <CodeBlock code={data.code} />;
    case "table":
      return (
        <div className="my-8 overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 shadow-lg">
            <tbody className="bg-white">
              {data.content.map((row, rowIndex) => (
                <tr key={rowIndex} className="divide-x divide-gray-200">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-lg"
                      dangerouslySetInnerHTML={{ __html: cell }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "quote":
      return (
        <blockquote className="my-8 border-l-4 border-gray-400 pl-8 italic text-gray-600 text-2xl">
          <p dangerouslySetInnerHTML={{ __html: data.text }} />
          {data.author && (
            <footer className="mt-2 text-right text-xl font-medium text-gray-600">
              — {data.author}
            </footer>
          )}
        </blockquote>
      );
    case "list":
      if (data.style === "ordered") {
        return (
          <ol className="my-8 list-decimal list-inside text-gray-800 text-xl">
            {data.items.map((item, index) => (
              <li key={index} className="my-3" dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ol>
        );
      } else {
        return (
          <ul className="my-8 list-disc list-inside text-gray-800 text-xl">
            {data.items.map((item, index) => (
              <li key={index} className="my-3" dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>
        );
      }
    case "delimiter":
      return <hr className="my-8 border-t-2 border-gray-200" />;
    case "checklist":
      return (
        <ul className="my-8">
          {data.items.map((item, index) => (
            <li key={index} className="flex items-center space-x-4 my-3">
              <input
                type="checkbox"
                checked={item.checked}
                readOnly
                className="form-checkbox h-6 w-6 text-blue-600"
              />
              <span className="text-gray-800 text-xl" dangerouslySetInnerHTML={{ __html: item.text }} />
            </li>
          ))}
        </ul>
      );
    case "warning":
      return (
        <div
          className="my-8 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-6 rounded-xl shadow-lg"
          role="alert"
        >
          {data.title && <p className="font-bold text-2xl">{data.title}</p>}
          {data.message && (
            <p className="mt-3 text-xl" dangerouslySetInnerHTML={{ __html: data.message }} />
          )}
        </div>
      );
    case "linkTool":
      return <LinkToolBlock data={data} />;
    case "youtubeEmbed":
      return <YouTubeEmbed data={data} />;
    default:
      return <div className="my-8 text-red-500">Unsupported block type: {type}</div>;
  }
};

export default BlogContent;
