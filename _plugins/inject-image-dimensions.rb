# frozen_string_literal: true
#
# BLOG-017b: Inject intrinsic width/height into in-content (Markdown) <img> tags.
#
# Front-matter hero/card/featured images flow through
# _includes/responsive-image.html, which reserves layout space with width/height
# from _data/image_dimensions.yml (BLOG-017). In-content charts written as
# Markdown (![alt](/assets/charts/foo.svg)) are rendered by Kramdown as bare
# <img> tags with no dimensions, so they still cause layout shift (CLS). This
# post-render hook looks up each <img>'s src in the same dimensions map and
# injects width/height when missing — completing the CLS work started in
# BLOG-017 without editing any source Markdown.
module InjectImageDimensions
  IMG_TAG  = /<img\b[^>]*>/i
  SRC_ATTR = /\bsrc\s*=\s*(["'])(.*?)\1/i
  HAS_DIMS = /\b(?:width|height)\s*=/i
  CLOSE    = /(\s*\/?>)\z/

  module_function

  # Inject width/height into every <img> in +content+ whose src resolves to an
  # entry in +dims+ and that does not already declare a dimension. Idempotent.
  def inject(content, dims, baseurl)
    return content if content.nil? || dims.nil? || dims.empty?

    content.gsub(IMG_TAG) do |tag|
      next tag if tag =~ HAS_DIMS

      src = tag.match(SRC_ATTR)
      next tag unless src

      entry = dims[normalize(src[2], baseurl)]
      next tag unless entry && entry["width"] && entry["height"]

      attrs = %( width="#{entry["width"]}" height="#{entry["height"]}")
      tag.sub(CLOSE, "#{attrs}\\1")
    end
  end

  # Strip an optional leading baseurl so the src matches the map keys, which are
  # stored as site-absolute paths (e.g. "/assets/charts/foo.svg").
  def normalize(src, baseurl)
    src = src.strip
    return src[baseurl.length..] || src if !baseurl.empty? && src.start_with?(baseurl)

    src
  end
end

Jekyll::Hooks.register %i[documents pages], :post_render do |doc|
  dims = doc.site.data["image_dimensions"]
  next unless dims

  baseurl = doc.site.config["baseurl"].to_s
  doc.output = InjectImageDimensions.inject(doc.output, dims, baseurl)
end
