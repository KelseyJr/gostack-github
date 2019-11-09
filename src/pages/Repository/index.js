import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import api from '../../services/api';

import Container from '../../components/Container/index';
import { Loading, Owner, IssueList, IssueState, IssuePage } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    filters: [
      { state: 'all', label: 'Todas', active: true, color: 'blue' },
      { state: 'open', label: 'Abertas', active: false, color: 'green' },
      { state: 'closed', label: 'Fechadas', active: false, color: 'red' },
    ],
    index: 0,
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { filters } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`repos/${repoName}`),
      api.get(`repos/${repoName}/issues`, {
        params: {
          state: filters.find(f => f.active).state,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  loadIssues = async () => {
    const { match } = this.props;
    const { index, page, filters } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filters[index].state,
        per_page: 5,
        page,
      },
    });

    this.setState({ issues: response.data });
  };

  handleState = async index => {
    await this.setState({ index, page: 1 });
    this.loadIssues();
  };

  handleIncrementPage = async () => {
    const { page } = this.state;
    await this.setState({ page: page + 1 });
    this.loadIssues();
  };

  handleDecrementPage = async () => {
    const { page } = this.state;
    if (page === 1) return;
    await this.setState({ page: page - 1 });
    this.loadIssues();
  };

  render() {
    const {
      repository,
      issues,
      loading,
      filters,
      page,
      index: filterIndex,
    } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <IssueState active={filterIndex}>
            {filters.map((filter, index) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => this.handleState(index)}
              >
                {filter.label}
              </button>
            ))}
          </IssueState>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <IssuePage page={page}>
          <button
            type="button"
            onClick={this.handleDecrementPage}
            disabled={page < 2}
          >
            Voltar
          </button>
          <p>{page}</p>
          <button type="button" onClick={this.handleIncrementPage}>
            Próxima
          </button>
        </IssuePage>
      </Container>
    );
  }
}
