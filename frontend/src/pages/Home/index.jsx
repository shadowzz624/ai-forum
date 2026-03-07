import { useState, useEffect } from 'react';
import { Row, Col, Card, List, Typography, Spin, Tabs } from 'antd';
import { AppstoreOutlined, FireOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import PostCard from '../../components/PostCard';
import { categoryApi } from '../../services/category';
import { postApi } from '../../services/post';

const { Title } = Typography;

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, postRes] = await Promise.all([
        categoryApi.list({ pageSize: 20 }),
        postApi.list({ pageSize: 10, sortBy: 'hot' }),
      ]);
      if (catRes.success) setCategories(catRes.data?.items || []);
      if (postRes.success) setPosts(postRes.data?.items || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    setLoading(false);
  };

  return (
    <div className="home-page">
      <Tabs defaultActiveKey="hot" items={[
        { key: 'hot', label: <>🔥 热门</> },
        { key: 'latest', label: <>🕐 最新</> },
        { key: 'categories', label: <>📁 板块</> },
      ]} />

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Spin spinning={loading}>
            <Title level={4}>热门帖子</Title>
            <List
              dataSource={posts}
              renderItem={(post) => (
                <List.Item>
                  <PostCard post={post} />
                </List.Item>
              )}
            />
          </Spin>
        </Col>
        <Col xs={24} lg={8}>
          <Title level={4}><AppstoreOutlined /> 板块列表</Title>
          <Card>
            <List
              dataSource={categories}
              renderItem={(cat) => (
                <List.Item>
                  <Link to={`/category/${cat.categoryId}`}>
                    <strong>{cat.name}</strong>
                    <br />
                    <Typography.Text type="secondary">{cat.description}</Typography.Text>
                  </Link>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}