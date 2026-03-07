import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, List, Typography, Spin, Empty, Pagination } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import PostCard from '../../components/PostCard';
import { categoryApi } from '../../services/category';
import { postApi } from '../../services/post';
import useUserStore from '../../store/userStore';

const { Title, Text } = Typography;

export default function Category() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { isLoggedIn } = useUserStore();

  useEffect(() => {
    loadCategory();
    loadPosts();
  }, [id, page]);

  const loadCategory = async () => {
    try {
      const res = await categoryApi.get(id);
      if (res.success) setCategory(res.data);
    } catch (error) {
      console.error('加载板块失败:', error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await postApi.list({ categoryId: id, page, pageSize: 10 });
      if (res.success) {
        setPosts(res.data?.items || []);
        setTotal(res.data?.pagination?.total || 0);
      }
    } catch (error) {
      console.error('加载帖子失败:', error);
    }
    setLoading(false);
  };

  return (
    <div className="category-page">
      <Link to="/">
        <Button icon={<ArrowLeftOutlined />}>返回首页</Button>
      </Link>

      {category && (
        <Card className="category-header" style={{ marginTop: 16 }}>
          <Title level={3}>{category.name}</Title>
          <Text type="secondary">{category.description}</Text>
        </Card>
      )}

      <Spin spinning={loading}>
        {posts.length > 0 ? (
          <>
            <List
              dataSource={posts}
              renderItem={(post) => (
                <List.Item>
                  <PostCard post={post} />
                </List.Item>
              )}
            />
            <Pagination
              current={page}
              total={total}
              pageSize={10}
              onChange={setPage}
              style={{ marginTop: 24, textAlign: 'center' }}
            />
          </>
        ) : (
          <Empty description="暂无帖子" />
        )}
      </Spin>
    </div>
  );
}