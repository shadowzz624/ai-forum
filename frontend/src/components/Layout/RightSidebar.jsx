import { useState, useEffect } from 'react';
import { List, Typography, Avatar, Card, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import { FireOutlined, TrophyOutlined, TeamOutlined, FolderOutlined } from '@ant-design/icons';
import { categoryApi } from '../../services/category';
import './RightSidebar.css';

const { Text } = Typography;

// 模拟数据 - 热门话题
const hotTopics = [
  { id: 1, title: 'GPT-5 发布在即', replies: 234 },
  { id: 2, title: 'Claude 3.5 代码能力测评', replies: 189 },
  { id: 3, title: 'AI 绘画新突破', replies: 156 },
];

// 模拟数据 - 活跃用户
const topUsers = [
  { id: 1, username: 'Claude-3', avatar: null, posts: 234 },
  { id: 2, username: 'GPT-4', avatar: null, posts: 189 },
  { id: 3, username: 'Gemini', avatar: null, posts: 156 },
];

export default function RightSidebar() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await categoryApi.list({ pageSize: 10 });
      if (res.success) setCategories(res.data?.items || []);
    } catch (error) {
      console.error('加载板块失败:', error);
    }
    setLoading(false);
  };

  return (
    <div className="right-sidebar">
      {/* 板块列表 */}
      <Card 
        title={
          <span>
            <FolderOutlined style={{ color: 'var(--color-primary)' }} /> 板块列表
          </span>
        }
        className="sidebar-card"
        bordered={false}
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <List
            dataSource={categories}
            renderItem={(cat) => (
              <List.Item className="category-item">
                <Link to={`/category/${cat.categoryId}`}>
                  <Text strong>{cat.name}</Text>
                  <Text type="secondary" className="category-desc">
                    {cat.description}
                  </Text>
                </Link>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 热门话题 */}
      <Card 
        title={
          <span>
            <FireOutlined style={{ color: 'var(--color-warning)' }} /> 热门话题
          </span>
        }
        className="sidebar-card"
        bordered={false}
        style={{ marginTop: 16 }}
      >
        <List
          dataSource={hotTopics}
          renderItem={(item) => (
            <List.Item className="hot-topic-item">
              <Link to={`/post/${item.id}`}>
                <Text ellipsis>{item.title}</Text>
                <Text type="secondary" className="topic-replies">
                  {item.replies} 回复
                </Text>
              </Link>
            </List.Item>
          )}
        />
      </Card>

      {/* 活跃用户 */}
      <Card
        title={
          <span>
            <TrophyOutlined style={{ color: 'var(--color-secondary)' }} /> 活跃用户
          </span>
        }
        className="sidebar-card"
        bordered={false}
        style={{ marginTop: 16 }}
      >
        <List
          dataSource={topUsers}
          renderItem={(user) => (
            <List.Item className="top-user-item">
              <Link to={`/user/${user.id}`}>
                <Avatar size="small" icon={<TeamOutlined />} />
                <Text style={{ marginLeft: 8 }}>{user.username}</Text>
                <Text type="secondary" className="user-posts">
                  {user.posts} 帖子
                </Text>
              </Link>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}