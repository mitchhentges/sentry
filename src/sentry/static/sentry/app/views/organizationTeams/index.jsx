import React from 'react';
import Reflux from 'reflux';
import {Link} from 'react-router';

import {t} from '../../locale';
import ApiMixin from '../../mixins/apiMixin';
import OrganizationHomeContainer from '../../components/organizations/homeContainer';
import OrganizationState from '../../mixins/organizationState';
import TeamStore from '../../stores/teamStore';
import TooltipMixin from '../../mixins/tooltip';
import {sortArray, arrayIsEqual} from '../../utils';

import ExpandedTeamList from './expandedTeamList';
import OrganizationStatOverview from './organizationStatOverview';
import {loadStats} from '../../actionCreators/projects';

const OrganizationTeams = React.createClass({
  mixins: [
    ApiMixin,
    OrganizationState,
    Reflux.listenTo(TeamStore, 'onTeamListChange'),
    TooltipMixin({
      selector: '.tip'
    })
  ],

  getInitialState() {
    return {
      teamList: sortArray(TeamStore.getAll(), function(o) {
        return o.name;
      }),
      projectStats: {},
    };
  },


  componentWillUpdate(nextProps, nextState) {
    if (!arrayIsEqual(nextState.teamList.map(team => team.id), this.state.teamList.map(team => team.id)))
      this.fetchStats();
  },

  fetchStats() {
    loadStats(this.api, {
      orgId: this.props.params.orgId,
      query: {
        since: new Date().getTime() / 1000 - 3600 * 24,
        stat: 'received',
        group: 'project'
      }
    });
  },

  onTeamListChange() {
    let newTeamList = TeamStore.getAll();

    this.setState({
      teamList: sortArray(newTeamList, function(o) {
        return o.name;
      })
    });
  },

  toggleTeams(nav) {
    this.setState({activeNav: nav});
  },

  render() {
    if (!this.context.organization)
      return null;

    let access = this.getAccess();
    let features = this.getFeatures();
    let org = this.getOrganization();

    let activeNav = /^\/[^\/]+\/$/.test(this.props.location.pathname) ?
      'your-teams' : 'all-teams';
    let allTeams = this.state.teamList;
    let activeTeams = this.state.teamList.filter((team) => team.isMember);

    return (
      <OrganizationHomeContainer>
        <div className="row">
          <div className="col-md-9">
            <div className="team-list">
              <ul className="nav nav-tabs border-bottom">
                <li className={activeNav === 'your-teams' && 'active'}>
                  <Link to={`/${org.slug}/`}>{t('Your Teams')}</Link>
                </li>
                <li className={activeNav === 'all-teams' && 'active'}>
                  <Link to={`/organizations/${org.slug}/all-teams/`}>{t('All Teams')} <span className="badge badge-soft">{allTeams.length}</span></Link>
                </li>
              </ul>
              {this.props.children ? /* should be AllTeamsList */
                React.cloneElement(this.props.children, {
                  organization: org,
                  teamList: allTeams,
                  access: access,
                  openMembership: features.has('open-membership') || access.has('org:write')
                }) :
                <ExpandedTeamList
                  organization={org} teamList={activeTeams}
                  projectStats={this.state.projectStats}
                  hasTeams={allTeams.length !== 0}
                  access={access}/>
              }
            </div>
          </div>
          <OrganizationStatOverview orgId={this.props.params.orgId} className="col-md-3 stats-column" />
        </div>
      </OrganizationHomeContainer>
    );
  }
});

export default OrganizationTeams;
