import React from 'react';
import PropTypes from 'prop-types';
import warning from 'warning';
import classNames from 'classnames';
import RootRef from '../RootRef';
import withStyles from '../styles/withStyles';
import { capitalize } from '../utils/helpers';
import exactProp from '../utils/exactProp';
import Grow from '../Grow';
import Popper from '../Popper';

export const styles = theme => ({
  popper: {
    zIndex: theme.zIndex.tooltip,
    opacity: 0.9,
  },
  tooltip: {
    backgroundColor: theme.palette.grey[700],
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.common.white,
    fontFamily: theme.typography.fontFamily,
    padding: '4px 8px',
    fontSize: theme.typography.pxToRem(10),
    lineHeight: `${theme.typography.round(14 / 10)}em`,
  },
  touch: {
    padding: '8px 16px',
    fontSize: theme.typography.pxToRem(14),
    lineHeight: `${theme.typography.round(16 / 14)}em`,
  },
  tooltipPlacementLeft: {
    transformOrigin: 'right center',
    margin: '0 24px ',
    [theme.breakpoints.up('sm')]: {
      margin: '0 14px',
    },
  },
  tooltipPlacementRight: {
    transformOrigin: 'left center',
    margin: '0 24px',
    [theme.breakpoints.up('sm')]: {
      margin: '0 14px',
    },
  },
  tooltipPlacementTop: {
    transformOrigin: 'center bottom',
    margin: '24px 0',
    [theme.breakpoints.up('sm')]: {
      margin: '14px 0',
    },
  },
  tooltipPlacementBottom: {
    transformOrigin: 'center top',
    margin: '24px 0',
    [theme.breakpoints.up('sm')]: {
      margin: '14px 0',
    },
  },
});

class Tooltip extends React.Component {
  enterTimer = null;

  leaveTimer = null;

  touchTimer = null;

  closeTimer = null;

  childrenRef = null;

  isControlled = null;

  ignoreNonTouchEvents = false;

  defaultId = null;

  constructor(props) {
    super(props);

    this.isControlled = props.open != null;
    this.state = {
      open: null,
    };

    if (!this.isControlled) {
      // not controlled, use internal state
      this.state.open = false;
    }
  }

  componentDidMount() {
    warning(
      !this.childrenRef ||
        !this.childrenRef.disabled ||
        !this.childrenRef.tagName.toLowerCase() === 'button',
      [
        'Material-UI: you are providing a disabled `button` child to the Tooltip component.',
        'A disabled element does not fire events.',
        "Tooltip needs to listen to the child element's events to display the title.",
        '',
        'Place a `div` container on top of the element.',
      ].join('\n'),
    );

    // Fallback to this default id when possible.
    // Use the random value for client side rendering only.
    // We can't use it server side.
    this.defaultId = `mui-tooltip-${Math.round(Math.random() * 1e5)}`;

    // Rerender with this.defaultId and this.childrenRef.
    if (this.props.open) {
      this.forceUpdate();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.enterTimer);
    clearTimeout(this.leaveTimer);
    clearTimeout(this.touchTimer);
    clearTimeout(this.closeTimer);
  }

  handleEnter = event => {
    const { children, enterDelay } = this.props;
    const childrenProps = children.props;

    if (event.type === 'focus' && childrenProps.onFocus) {
      childrenProps.onFocus(event);
    }

    if (event.type === 'mouseenter' && childrenProps.onMouseEnter) {
      childrenProps.onMouseEnter(event);
    }

    if (this.ignoreNonTouchEvents && event.type !== 'touchstart') {
      return;
    }

    clearTimeout(this.enterTimer);
    clearTimeout(this.leaveTimer);
    if (enterDelay) {
      event.persist();
      this.enterTimer = setTimeout(() => {
        this.handleOpen(event);
      }, enterDelay);
    } else {
      this.handleOpen(event);
    }
  };

  handleOpen = event => {
    if (!this.isControlled) {
      this.setState({ open: true });
    }

    if (this.props.onOpen) {
      this.props.onOpen(event, true);
    }
  };

  handleLeave = event => {
    const { children, leaveDelay } = this.props;
    const childrenProps = children.props;

    if (event.type === 'blur' && childrenProps.onBlur) {
      childrenProps.onBlur(event);
    }

    if (event.type === 'mouseleave' && childrenProps.onMouseLeave) {
      childrenProps.onMouseLeave(event);
    }

    clearTimeout(this.enterTimer);
    clearTimeout(this.leaveTimer);
    if (leaveDelay) {
      event.persist();
      this.leaveTimer = setTimeout(() => {
        this.handleClose(event);
      }, leaveDelay);
    } else {
      this.handleClose(event);
    }
  };

  handleClose = event => {
    if (!this.isControlled) {
      this.setState({ open: false });
    }

    if (this.props.onClose) {
      this.props.onClose(event, false);
    }

    clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => {
      this.ignoreNonTouchEvents = false;
    }, this.props.theme.transitions.duration.shortest);
  };

  handleTouchStart = event => {
    this.ignoreNonTouchEvents = true;
    const { children, enterTouchDelay } = this.props;

    if (children.props.onTouchStart) {
      children.props.onTouchStart(event);
    }

    clearTimeout(this.leaveTimer);
    clearTimeout(this.closeTimer);
    clearTimeout(this.touchTimer);
    event.persist();
    this.touchTimer = setTimeout(() => {
      this.handleEnter(event);
    }, enterTouchDelay);
  };

  handleTouchEnd = event => {
    const { children, leaveTouchDelay } = this.props;

    if (children.props.onTouchEnd) {
      children.props.onTouchEnd(event);
    }

    clearTimeout(this.touchTimer);
    clearTimeout(this.leaveTimer);
    event.persist();
    this.leaveTimer = setTimeout(() => {
      this.handleClose(event);
    }, leaveTouchDelay);
  };

  render() {
    const {
      children,
      classes,
      disableFocusListener,
      disableHoverListener,
      disableTouchListener,
      id,
      open: openProp,
      placement,
      PopperProps,
      theme,
      title,
      TransitionComponent,
      TransitionProps,
    } = this.props;

    let open = this.isControlled ? openProp : this.state.open;

    // There is no point at displaying an empty tooltip.
    if (title === '') {
      open = false;
    }

    const childrenProps = {
      'aria-describedby': open ? id || this.defaultId : null,
      title: !open && typeof title === 'string' ? title : null,
    };

    if (!disableTouchListener) {
      childrenProps.onTouchStart = this.handleTouchStart;
      childrenProps.onTouchEnd = this.handleTouchEnd;
    }

    if (!disableHoverListener) {
      childrenProps.onMouseEnter = this.handleEnter;
      childrenProps.onMouseLeave = this.handleLeave;
    }

    if (!disableFocusListener) {
      childrenProps.onFocus = this.handleEnter;
      childrenProps.onBlur = this.handleLeave;
    }

    warning(
      !children.props.title,
      [
        'Material-UI: you have been providing a `title` property to the child of <Tooltip />.',
        `Remove this title property \`${children.props.title}\` or the Tooltip component.`,
      ].join('\n'),
    );

    return (
      <React.Fragment>
        <RootRef
          rootRef={node => {
            this.childrenRef = node;
          }}
        >
          {React.cloneElement(children, childrenProps)}
        </RootRef>
        <Popper
          className={classes.popper}
          placement={placement}
          anchorEl={this.childrenRef}
          open={open}
          id={childrenProps['aria-describedby']}
          transition
          {...PopperProps}
        >
          {({ placement: placementInner, TransitionProps: TransitionPropsInner }) => (
            <TransitionComponent
              timeout={theme.transitions.duration.shorter}
              {...TransitionPropsInner}
              {...TransitionProps}
            >
              <div
                className={classNames(
                  classes.tooltip,
                  {
                    [classes.touch]: this.ignoreNonTouchEvents,
                  },
                  classes[`tooltipPlacement${capitalize(placementInner.split('-')[0])}`],
                )}
              >
                {title}
              </div>
            </TransitionComponent>
          )}
        </Popper>
      </React.Fragment>
    );
  }
}

Tooltip.propTypes = {
  /**
   * Tooltip reference element.
   */
  children: PropTypes.element.isRequired,
  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: PropTypes.object.isRequired,
  /**
   * Do not respond to focus events.
   */
  disableFocusListener: PropTypes.bool,
  /**
   * Do not respond to hover events.
   */
  disableHoverListener: PropTypes.bool,
  /**
   * Do not respond to long press touch events.
   */
  disableTouchListener: PropTypes.bool,
  /**
   * The number of milliseconds to wait before showing the tooltip.
   * This property won't impact the enter touch delay (`enterTouchDelay`).
   */
  enterDelay: PropTypes.number,
  /**
   * The number of milliseconds a user must touch the element before showing the tooltip.
   */
  enterTouchDelay: PropTypes.number,
  /**
   * The relationship between the tooltip and the wrapper component is not clear from the DOM.
   * This property is used with aria-describedby to solve the accessibility issue.
   * If you don't provide this property. It fallback to a random generated id.
   */
  id: PropTypes.string,
  /**
   * The number of milliseconds to wait before hiding the tooltip.
   * This property won't impact the leave touch delay (`leaveTouchDelay`).
   */
  leaveDelay: PropTypes.number,
  /**
   * The number of milliseconds after the user stops touching an element before hiding the tooltip.
   */
  leaveTouchDelay: PropTypes.number,
  /**
   * Callback fired when the tooltip requests to be closed.
   *
   * @param {object} event The event source of the callback
   */
  onClose: PropTypes.func,
  /**
   * Callback fired when the tooltip requests to be open.
   *
   * @param {object} event The event source of the callback
   */
  onOpen: PropTypes.func,
  /**
   * If `true`, the tooltip is shown.
   */
  open: PropTypes.bool,
  /**
   * Tooltip placement.
   */
  placement: PropTypes.oneOf([
    'bottom-end',
    'bottom-start',
    'bottom',
    'left-end',
    'left-start',
    'left',
    'right-end',
    'right-start',
    'right',
    'top-end',
    'top-start',
    'top',
  ]),
  /**
   * Properties applied to the [`Popper`](/api/popper) element.
   */
  PopperProps: PropTypes.object,
  /**
   * @ignore
   */
  theme: PropTypes.object.isRequired,
  /**
   * Tooltip title. Zero-length titles string are never displayed.
   */
  title: PropTypes.node.isRequired,
  /**
   * Transition component.
   */
  TransitionComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
  /**
   * Properties applied to the `Transition` element.
   */
  TransitionProps: PropTypes.object,
};

Tooltip.propTypes = exactProp(Tooltip.propTypes);

Tooltip.defaultProps = {
  disableFocusListener: false,
  disableHoverListener: false,
  disableTouchListener: false,
  enterDelay: 0,
  enterTouchDelay: 1000,
  leaveDelay: 0,
  leaveTouchDelay: 1500,
  placement: 'bottom',
  TransitionComponent: Grow,
};

export default withStyles(styles, { name: 'MuiTooltip', withTheme: true })(Tooltip);
