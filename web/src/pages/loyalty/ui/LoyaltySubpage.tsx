import { PageContainer, type PageContainerProps } from '@ant-design/pro-components';
import { Link } from '@tanstack/react-router';

/**
 * Каркас подстраницы «Лояльності»: заголовок и крошки «Лояльність › <раздел>».
 * Подстраниц нет в меню, поэтому крошки задаём явно, а не из маршрутов ProLayout.
 */
export function LoyaltySubpage({ title, ...props }: PageContainerProps & { title: string }) {
  return (
    <PageContainer
      {...props}
      title={title}
      breadcrumb={{
        items: [{ title: <Link to="/loyalty">Лояльність</Link> }, { title }],
      }}
    />
  );
}
