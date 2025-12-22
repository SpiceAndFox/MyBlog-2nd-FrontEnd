import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const defaultLinkOpen =
  markdown.renderer.rules.link_open ||
  ((tokens, index, options, env, self) => self.renderToken(tokens, index, options));

markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index];

  const targetIndex = token.attrIndex("target");
  if (targetIndex < 0) token.attrPush(["target", "_blank"]);
  else token.attrs[targetIndex][1] = "_blank";

  const relIndex = token.attrIndex("rel");
  if (relIndex < 0) token.attrPush(["rel", "noopener noreferrer"]);
  else token.attrs[relIndex][1] = "noopener noreferrer";

  return defaultLinkOpen(tokens, index, options, env, self);
};

export function renderChatMarkdown(value) {
  return markdown.render(String(value ?? ""));
}

