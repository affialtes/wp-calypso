/** @format */
/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import { isEmpty, filter } from 'lodash';
import classNames from 'classnames';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { cartItems } from 'lib/cart-values';
import getSiteId from 'state/selectors/get-site-id';
import SignupActions from 'lib/signup/actions';
import StepWrapper from 'signup/step-wrapper';
import QueryPlans from 'components/data/query-plans';
import QuerySitePlans from 'components/data/query-site-plans';
import { getDesignType } from 'state/signup/steps/design-type/selectors';
import { isEnabled } from 'config';
import PlanFeatures from 'my-sites/plan-features';
import { DESIGN_TYPE_STORE } from 'signup/constants';

import { planHasFeature } from 'lib/plans';
import {
	FEATURE_UPLOAD_THEMES_PLUGINS,
	PLAN_FREE,
	PLAN_PERSONAL,
	PLAN_PREMIUM,
	PLAN_BUSINESS,
	PLAN_ECOMMERCE,
} from 'lib/plans/constants';

export class PlansAtomicStoreStep extends Component {
	static propTypes = {
		additionalStepData: PropTypes.object,
		goToNextStep: PropTypes.func.isRequired,
		hideFreePlan: PropTypes.bool,
		siteId: PropTypes.number,
		stepName: PropTypes.string.isRequired,
		stepSectionName: PropTypes.string,
		translate: PropTypes.func.isRequired,
	};

	constructor( props ) {
		super( props );

		this.onSelectPlan = this.onSelectPlan.bind( this );
		this.plansFeaturesSelection = this.plansFeaturesSelection.bind( this );
	}

	onSelectPlan( cartItem ) {
		const {
				additionalStepData,
				stepSectionName,
				stepName,
				goToNextStep,
				translate,
				signupDependencies: { domainItem },
				designType,
			} = this.props,
			privacyItem =
				cartItem && domainItem && cartItems.domainPrivacyProtection( { domain: domainItem.meta } );

		if ( cartItem ) {
			analytics.tracks.recordEvent( 'calypso_signup_plan_select', {
				product_slug: cartItem.product_slug,
				free_trial: cartItem.free_trial,
				from_section: stepSectionName ? stepSectionName : 'default',
			} );

			// If we're inside the store signup flow and the cart item is a Business or eCommerce Plan,
			// set a flag on it. It will trigger Automated Transfer when the product is being
			// activated at the end of the checkout process.
			if (
				designType === DESIGN_TYPE_STORE &&
				planHasFeature( cartItem.product_slug, FEATURE_UPLOAD_THEMES_PLUGINS )
			) {
				cartItem.extra = Object.assign( cartItem.extra || {}, {
					is_store_signup: true,
				} );
			}
		} else {
			analytics.tracks.recordEvent( 'calypso_signup_free_plan_select', {
				from_section: stepSectionName ? stepSectionName : 'default',
			} );
		}

		const step = {
			processingMessage: isEmpty( cartItem )
				? translate( 'Free plan selected' )
				: translate( 'Adding your plan' ),
			stepName,
			stepSectionName,
			cartItem,
			privacyItem,
			...additionalStepData,
		};

		const providedDependencies = { cartItem, privacyItem };

		SignupActions.submitSignupStep( step, [], providedDependencies );

		goToNextStep();
	}

	getDomainName() {
		return (
			this.props.signupDependencies.domainItem && this.props.signupDependencies.domainItem.meta
		);
	}

	plansFeaturesList() {
		const { hideFreePlan, siteId, designType } = this.props;

		const isPersonalPlanEnabled = isEnabled( 'plans/personal-plan' );

		let plans = filter(
			[
				hideFreePlan ? null : PLAN_FREE,
				isPersonalPlanEnabled ? PLAN_PERSONAL : null,
				PLAN_PREMIUM,
				PLAN_BUSINESS,
				PLAN_ECOMMERCE,
			],
			value => !! value
		);

		if ( designType === DESIGN_TYPE_STORE ) {
			plans = [ PLAN_BUSINESS ];
		}

		return (
			<div>
				<QueryPlans />
				<QuerySitePlans siteId={ siteId } />

				<PlanFeatures
					plans={ plans }
					onUpgradeClick={ this.onSelectPlan }
					isInSignup={ true }
					siteId={ siteId }
					domainName={ this.getDomainName() }
					displayJetpackPlans={ false }
				/>
			</div>
		);
	}

	plansFeaturesSelection() {
		const {
			flowName,
			stepName,
			positionInFlow,
			signupProgress,
			translate,
			designType,
		} = this.props;

		let headerText = translate( "Pick a plan that's right for you." );

		if ( designType === DESIGN_TYPE_STORE ) {
			headerText = translate( "You'll need the Business plan." );
		}

		return (
			<StepWrapper
				flowName={ flowName }
				stepName={ stepName }
				positionInFlow={ positionInFlow }
				headerText={ headerText }
				fallbackHeaderText={ headerText }
				signupProgress={ signupProgress }
				isWideLayout={ true }
				stepContent={ this.plansFeaturesList() }
			/>
		);
	}

	render() {
		const { designType } = this.props;

		const classes = classNames( 'plans plans-step', {
			'is-store-flow': designType === DESIGN_TYPE_STORE,
			'has-no-sidebar': true,
			'is-wide-layout': true,
		} );

		return <div className={ classes }>{ this.plansFeaturesSelection() }</div>;
	}
}

export default connect( ( state, { signupDependencies: { siteSlug } } ) => ( {
	siteId: getSiteId( state, siteSlug ),
	designType: getDesignType( state ),
} ) )( localize( PlansAtomicStoreStep ) );
