/** @format */

/**
 * Higher Order Publicize sharing form composition.
 *
 * Uses Gutenberg data API to dispatch publicize form data to
 * editor post data in format to match 'publicize' field schema.
 */

/**
 * External dependencies
 */
import get from 'lodash/get';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PublicizeFormUnwrapped from './form-unwrapped';

const PublicizeForm = compose( [
	withSelect( select => {
		const meta = select( 'core/editor' ).getEditedPostAttribute( 'meta' );

		return {
			connections: select( 'core/editor' ).getEditedPostAttribute(
				'jetpack_publicize_connections'
			),
			meta,
			shareMessage: get( meta, [ 'jetpack_publicize_message' ], '' ),
		};
	} ),
	withDispatch( ( dispatch, { connections, meta } ) => ( {
		/**
		 * Toggle connection enable/disable state based on checkbox.
		 *
		 * Saves enable/disable value to connections property in editor
		 * in field 'jetpack_publicize_connections'.
		 *
		 * @param {number}  id ID of the connection being enabled/disabled
		 */
		toggleConnection( id ) {
			const newConnections = connections.map( c => ( {
				...c,
				enabled: c.id === id ? ! c.enabled : c.enabled,
			} ) );

			dispatch( 'core/editor' ).editPost( {
				jetpack_publicize_connections: newConnections,
			} );
		},

		/**
		 * Handler for when sharing message is edited.
		 *
		 * Saves edited message to state and to the editor
		 * in field 'jetpack_publicize_message'.
		 *
		 * @param {object} event Change event data from textarea element.
		 */
		messageChange( event ) {
			dispatch( 'core/editor' ).editPost( {
				meta: {
					...meta,
					jetpack_publicize_message: event.target.value,
				},
			} );
		},
	} ) ),
] )( PublicizeFormUnwrapped );

export default PublicizeForm;
