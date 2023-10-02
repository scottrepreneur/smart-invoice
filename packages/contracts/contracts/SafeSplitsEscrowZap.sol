// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import './interfaces/ISafeProxyFactory.sol';
import "./interfaces/ISplitMain.sol";
import "./interfaces/ISpoilsManager.sol";
import "./interfaces/ISmartInvoiceFactory.sol";
import "./interfaces/ISmartInvoiceSplitEscrow.sol";
import "./interfaces/IWRAPPED.sol";

contract SafeSplitsEscrowZap is AccessControl {

    address dao; // DAO controller address
    address safeSingleton; // Safe Implementation
    ISafeProxyFactory safeFactory;
    ISplitMain splitMain;
    ISpoilsManager spoilsManager;
    ISmartInvoiceFactory escrowFactory;
    IWRAPPED wrappedNativeToken;
    uint32 distributorFee = 0; // 0xsplits Distributor Fee

    event SafeSplitEscrowCreated(
        address safe,
        address raidPartySplit,
        address daoSplit,
        address escrow
    );
    event UpdatedAddresses (
        address safeSingleton,
        address safeFactory,
        address splitMain,
        address escrowFactory
    );
    event UpdatedDistributorFee (
        uint32 distributorFee
    );

    struct ZapData {
        address safe;
        address raidPartySplit;
        address daoSplit;
        address escrow;
    }

    constructor (
        address _dao,
        address _safeSingleton,
        address _safeFactory,
        address _splitMain,
        address _spoilsManager,
        address _escrowFactory,
        address _wrappedNativeToken
    ) {
        _setupRole(DEFAULT_ADMIN_ROLE, _dao);
        dao = _dao;
        safeSingleton = _safeSingleton;
        safeFactory = ISafeProxyFactory(_safeFactory);
        splitMain = ISplitMain(_splitMain);
        spoilsManager = ISpoilsManager(_spoilsManager);
        escrowFactory = ISmartInvoiceFactory(_escrowFactory);
        wrappedNativeToken = IWRAPPED(_wrappedNativeToken);
    }

    function _deploySafe (
        address[] memory _owners,
        uint256 _threshold,
        uint256 _saltNonce,
        ZapData memory _zapData
    ) internal returns (ZapData memory) {

        bytes memory safeInitializer = abi.encodeWithSelector(
            bytes4(keccak256("setup(address[],uint256,address,bytes,address,address,uint256,address)")),
            _owners,
            _threshold,
            address(0),         // to
            bytes("0x"),        // data
            address(0),         // fallbackHandlerAddress
            address(0),         // paymentToken
            0,                  // payment
            address(0)          // paymentReceiver
        );

        // (implementation address, initializer data, salt nonce)
        _zapData.safe = safeFactory.createProxyWithNonce(safeSingleton, safeInitializer, _saltNonce);
        require(_zapData.safe != address(0), "safe creation failed");

        return _zapData;
    }

    function _createSplit (
        address[] memory _owners,
        uint32[] memory _percentAllocations,
        bool _isDaoSplit,
        ZapData memory _zapData
    ) internal returns (ZapData memory) {

        // (recipients array, percent allocations array, no distributor fee, safe address)
        _zapData.raidPartySplit = splitMain.createSplit(_owners, _percentAllocations, distributorFee, _zapData.safe);
        require(_zapData.raidPartySplit != address(0), "split creation failed");

        if (_isDaoSplit) {
            // dao split recipients
            address daoReceiver = ISpoilsManager(spoilsManager).getReceiver();
            address[] memory daoSplitRecipients = new address[](2);
            daoSplitRecipients[0] = _zapData.raidPartySplit;
            daoSplitRecipients[1] = daoReceiver;

            // calculate dao split amounts
            uint32 daoSplitAmount = ISpoilsManager(spoilsManager).getSpoils();
            uint32 raidSplitAmount = 100_000 - daoSplitAmount;
            uint32[] memory daoSplitPercentAllocations = new uint32[](2);
            daoSplitPercentAllocations[0] = raidSplitAmount;
            daoSplitPercentAllocations[1] = daoSplitAmount;
            
            // (recipients array, percent allocations array, no distributor fee, safe address)
            _zapData.daoSplit = ISplitMain(splitMain).createSplit(daoSplitRecipients, daoSplitPercentAllocations, 0, dao);
            require(_zapData.daoSplit != address(0), "dao split creation failed");
        }

        return _zapData;
    }

    function _deployEscrow (
        uint256[] memory _milestoneAmounts,
        uint256 _saltNonce,
        address _client,
        address _resolver,
        address _token,
        uint256 _terminationTime,
        bytes32 _details,
        ZapData memory _zapData
    ) internal returns (ZapData memory) {

        address[] memory escrowParams = new address[](2);
        escrowParams[0] = _zapData.safe;
        escrowParams[1] = _zapData.raidPartySplit;
        if (_zapData.daoSplit != address(0)) {
            escrowParams[0] = dao;
            escrowParams[1] = _zapData.daoSplit;
        }

        // todo remove `daoFee` for updatable receiver
        // encode data for escrow details
        bytes memory escrowData = abi.encode(
            _client,
            // ! pass this value
            uint8(0), // uint8(ADR.ARBITRATOR),
            _resolver,
            _token,
            _terminationTime,
            _details,
            wrappedNativeToken,
            false, // requireVerification
            address(escrowFactory), // factory address
            escrowParams[1], // `dao` providerReceiver
            10000 // `daoFee` (100) percent
        );

        // deploy SplitEscrow
        _zapData.escrow = escrowFactory.createDeterministic(
            escrowParams[0],
            _milestoneAmounts,
            escrowData,
            bytes32("split-escrow"),
            bytes32(_saltNonce)
        );
        require(_zapData.escrow != address(0), "escrow creation failed");
        
        return _zapData;
    }

    function createSafeSplitEscrow (
        address[] memory _owners, // safe owners and raid party split participants
        uint32[] memory _percentAllocations, // raid party split percent allocations
        uint256[] memory _milestoneAmounts,  // escrow milestone amounts
        uint256 _threshold,
        uint256 _saltNonce,
        bool _isDaoSplit,
        address _client,
        address _resolver,
        address _token,
        uint256 _terminationTime,
        bytes32 _details
    ) public {
        require(_percentAllocations.length == _owners.length, "invalid allocation amounts");

        ZapData memory zapData = ZapData({
            safe: address(0),
            raidPartySplit: address(0),
            daoSplit: address(0),
            escrow: address(0)
        });

        zapData = _deploySafe(_owners, _threshold, _saltNonce, zapData);

        zapData = _createSplit(_owners, _percentAllocations, _isDaoSplit, zapData);

        zapData = _deployEscrow(
            _milestoneAmounts,
            _saltNonce,
            _client,
            _resolver,
            _token,
            _terminationTime,
            _details,
            zapData
        );

        emit SafeSplitEscrowCreated(
            zapData.safe,
            zapData.raidPartySplit,
            zapData.daoSplit,
            zapData.escrow
        );
    }

    // view functions
    function getAddresses() view public returns (address, address, address, address, address, address, address) {
        return (
            dao,
            safeSingleton,
            address(safeFactory),
            address(splitMain),
            address(escrowFactory),
            address(spoilsManager),
            address(wrappedNativeToken)
        );
    }

    function getDistributorFee() view public returns (uint32) {
        return distributorFee;
    }

    // admin functions
    function updateAddresses(
        address _safeSingleton,
        address _safeFactory,
        address _splitMain,
        address _spoilsManager,
        address _escrowFactory
    ) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "not authorized");

        if (_safeSingleton != address(0)) {
            safeSingleton = _safeSingleton;
        }
        if (_safeFactory != address(0)) {
            safeFactory = ISafeProxyFactory(_safeFactory);
        }
        if (_splitMain != address(0)) {
            splitMain = ISplitMain(_splitMain);
        }
        if (_spoilsManager != address(0)) {
            spoilsManager = ISpoilsManager(_spoilsManager);
        }
        if (_escrowFactory != address(0)) {
            escrowFactory = ISmartInvoiceFactory(_escrowFactory);
        }

        emit UpdatedAddresses(
            _safeSingleton,
            _safeFactory,
            _splitMain,
            _escrowFactory
        );
    }

    function updateDistributorFee(uint32 _distributorFee) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "not authorized");
        distributorFee = _distributorFee;
        emit UpdatedDistributorFee(_distributorFee);
    }
}