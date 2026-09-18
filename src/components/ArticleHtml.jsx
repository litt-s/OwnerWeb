import { useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/common';

function languageOf(code) {
  const className = code.className || '';
  return className.match(/(?:language|lang)-([\w-]+)/)?.[1] || 'cpp';
}

export default function ArticleHtml({ content, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.parentElement?.classList.contains('article-code-block')) return;
      const code = pre.querySelector('code');
      if (!code) return;
      hljs.highlightElement(code);

      const shell = document.createElement('div');
      shell.className = 'article-code-block';
      const header = document.createElement('div');
      header.className = 'article-code-header';
      const language = document.createElement('span');
      language.textContent = languageOf(code);
      const actions = document.createElement('div');
      actions.className = 'article-code-actions';
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.textContent = '复制代码';
      copy.addEventListener('click', async () => {
        await navigator.clipboard?.writeText(code.textContent || '');
        copy.textContent = '已复制';
        window.setTimeout(() => { copy.textContent = '复制代码'; }, 1400);
      });
      actions.append(copy);
      header.append(language, actions);
      const lineNumbers = document.createElement('span');
      lineNumbers.className = 'article-code-line-numbers';
      lineNumbers.innerHTML = Array.from({ length: Math.max(1, (code.textContent || '').split('\n').length) }, (_, index) => `${index + 1}<br>`).join('');
      pre.parentNode.replaceChild(shell, pre);
      shell.append(header, lineNumbers, pre);
    });
  }, [content]);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: content }} />;
}
